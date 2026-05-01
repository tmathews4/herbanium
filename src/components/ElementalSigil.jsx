/* ──────────────────────────────────────────────────────────────
   components/ElementalSigil.jsx — procedural per-elemental mark.

   Hash the elemental's id into a small SVG signet inside a
   hexagonal frame. Stable per-elemental (same id → same sigil),
   so every appearance of "A Mist Heron" carries the same mark
   and the user reads it as that elemental's identity.

   Three layers of decoration, all hash-seeded:
     1. A hidden Elder Futhark rune drawn at low opacity beneath
        everything else — so a user familiar with runes can see
        the elemental's letter, but it reads as background
        geometry to anyone else. 22 runes (the politically-
        charged Sowilo and Othala are deliberately omitted).
     2. 1–2 chord lines connecting hex vertices.
     3. 2–3 small dots at hashed positions inside.
     4. A center mark (none / dot / plus / ring).

   That gives 22 runes × ~15 chord combos × ~30 dot placements ×
   4 center marks ≈ tens of thousands of unique sigils — no two
   earned elementals will share the same exact mark in any
   reasonable bestiary.

   Stroke color comes from the caller (use rarity tone) so the
   sigil ties into the existing common/uncommon/rare/legendary
   visual system.
   ────────────────────────────────────────────────────────────── */

import React from "react";

// Cheap deterministic hash. Same string → same number, every run.
function hashStr(s) {
  let h = 0;
  const str = s || "";
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// Elder Futhark runes — each defined as an array of polylines
// inside a 4-wide × 6-tall coordinate box centered at (2, 3).
// Standard rune forms (Wikipedia "Elder Futhark"). Sowilo (ᛊ)
// and Othala (ᛟ) are deliberately omitted because both have been
// co-opted by hate groups; the remaining 22 carry the alphabet's
// older, broader register.
const RUNES = {
  // Fehu ᚠ — cattle, wealth
  fehu: [
    [[2, 0], [2, 6]],
    [[2, 0.6], [3.6, -0.2]],
    [[2, 2.2], [3.6, 1.4]],
  ],
  // Uruz ᚢ — aurochs, strength
  uruz: [
    [[1, 6], [1, 0]],
    [[1, 0], [3, 1]],
    [[3, 1], [3, 6]],
  ],
  // Thurisaz ᚦ — thorn
  thurisaz: [
    [[1.5, 0], [1.5, 6]],
    [[1.5, 1.6], [3.2, 3]],
    [[3.2, 3], [1.5, 4.4]],
  ],
  // Ansuz ᚨ — divine breath
  ansuz: [
    [[1.5, 0], [1.5, 6]],
    [[1.5, 0.8], [3.5, 1.4]],
    [[1.5, 2.4], [3.5, 3]],
  ],
  // Raidho ᚱ — journey
  raidho: [
    [[1, 0], [1, 6]],
    [[1, 0], [3, 1.4]],
    [[3, 1.4], [1, 2.8]],
    [[1, 2.8], [3, 6]],
  ],
  // Kenaz ᚲ — torch
  kenaz: [
    [[1, 0], [3, 3]],
    [[3, 3], [1, 6]],
  ],
  // Gebo ᚷ — gift (X-cross)
  gebo: [
    [[0.5, 0], [3.5, 6]],
    [[0.5, 6], [3.5, 0]],
  ],
  // Wunjo ᚹ — joy
  wunjo: [
    [[1, 0], [1, 6]],
    [[1, 0], [3, 1]],
    [[3, 1], [1, 2]],
  ],
  // Hagalaz ᚺ — hail (two posts + diagonal)
  hagalaz: [
    [[0.6, 0], [0.6, 6]],
    [[3.4, 0], [3.4, 6]],
    [[0.6, 1.2], [3.4, 4.8]],
  ],
  // Naudhiz ᚾ — need
  naudhiz: [
    [[2, 0], [2, 6]],
    [[1, 4], [3, 2]],
  ],
  // Isa ᛁ — ice (single vertical)
  isa: [
    [[2, 0], [2, 6]],
  ],
  // Jera ᛃ — year, harvest (two interlocking hooks)
  jera: [
    [[1, 0.6], [3, 1.6]],
    [[3, 1.6], [1, 3]],
    [[1, 3], [3, 4.4]],
    [[3, 4.4], [1, 5.4]],
  ],
  // Eihwaz ᛇ — yew tree
  eihwaz: [
    [[2, 0], [2, 6]],
    [[2, 0], [3, 0.6]],
    [[2, 6], [1, 5.4]],
  ],
  // Perthro ᛈ — lot, fate (open bracket with bump)
  perthro: [
    [[3, 0], [1, 0]],
    [[1, 0], [1, 6]],
    [[1, 6], [3, 6]],
    [[1, 1.5], [3, 3]],
    [[3, 3], [1, 4.5]],
  ],
  // Algiz ᛉ — elk, protection (Y on a stem)
  algiz: [
    [[2, 1.8], [2, 6]],
    [[2, 1.8], [0.5, 0]],
    [[2, 1.8], [3.5, 0]],
  ],
  // Tiwaz ᛏ — Tyr, justice (arrow up)
  tiwaz: [
    [[2, 0], [2, 6]],
    [[2, 0], [0.6, 1.2]],
    [[2, 0], [3.4, 1.2]],
  ],
  // Berkano ᛒ — birch (B-shape)
  berkano: [
    [[1, 0], [1, 6]],
    [[1, 0], [3, 1.4]],
    [[3, 1.4], [1, 2.8]],
    [[1, 2.8], [3, 4.4]],
    [[3, 4.4], [1, 6]],
  ],
  // Ehwaz ᛖ — horse (M-shape)
  ehwaz: [
    [[1, 0], [1, 6]],
    [[3, 0], [3, 6]],
    [[1, 0], [3, 2]],
    [[3, 0], [1, 2]],
  ],
  // Mannaz ᛗ — humanity
  mannaz: [
    [[1, 0], [1, 6]],
    [[3, 0], [3, 6]],
    [[1, 0], [3, 3]],
    [[3, 0], [1, 3]],
  ],
  // Laguz ᛚ — water
  laguz: [
    [[1, 0], [1, 6]],
    [[1, 0], [3, 1.4]],
  ],
  // Ingwaz ᛜ — Ing, fertility (diamond)
  ingwaz: [
    [[2, 1], [3.4, 3]],
    [[3.4, 3], [2, 5]],
    [[2, 5], [0.6, 3]],
    [[0.6, 3], [2, 1]],
  ],
  // Dagaz ᛞ — day, awakening (bowtie inside box)
  dagaz: [
    [[0.6, 0], [3.4, 6]],
    [[3.4, 0], [0.6, 6]],
    [[0.6, 0], [0.6, 6]],
    [[3.4, 0], [3.4, 6]],
  ],
};
const RUNE_KEYS = Object.keys(RUNES);

export const ElementalSigil = ({
  elemental,
  size = 24,
  color = "#796E5B",
}) => {
  const seed = `${elemental?.id || elemental?.displayName || "anon"}|sigil`;
  let h = hashStr(seed);

  // Hexagon vertices — start at top point, walk clockwise.
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;
  const verts = [];
  for (let i = 0; i < 6; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 3;
    verts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  const hexPath = verts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  // Hidden Elder Futhark rune — picked first from the hash so the
  // rune choice is the most consistent layer per id. Drawn at low
  // opacity beneath everything else so it reads as background
  // pattern unless the viewer is looking for it.
  const runeIdx = h % RUNE_KEYS.length; h = Math.floor(h / RUNE_KEYS.length);
  const runeLines = RUNES[RUNE_KEYS[runeIdx]];
  // Scale so the 4×6 rune box fits inside ~62% of the hex. Center
  // it at (cx, cy) accounting for the box's (2, 3) center.
  const runeUnit = (size * 0.62) / 6;
  const runeOffsetX = cx - 2 * runeUnit;
  const runeOffsetY = cy - 3 * runeUnit;
  const runeStrokeWidth = Math.max(0.6, size * 0.03);

  // Chord lines — 1 or 2 of them, each connecting two non-adjacent
  // vertices. Adjacent (offset 1) is excluded so chords don't just
  // retrace the hex edges.
  const chordCount = 1 + (h % 2); h = Math.floor(h / 2);
  const chords = [];
  for (let i = 0; i < chordCount; i++) {
    const a = h % 6; h = Math.floor(h / 6);
    const offset = 2 + (h % 3); h = Math.floor(h / 3); // 2, 3, or 4
    const b = (a + offset) % 6;
    chords.push([a, b]);
  }

  // Inner dots — 2 or 3 positions on a polar grid.
  const dotCount = 2 + (h % 2); h = Math.floor(h / 2);
  const dots = [];
  for (let i = 0; i < dotCount; i++) {
    const p = h % 6; h = Math.floor(h / 6);
    const distStep = h % 4; h = Math.floor(h / 4);
    const dist = 0.30 + distStep * 0.12;          // 0.30 / 0.42 / 0.54 / 0.66
    const angle = -Math.PI / 2 + (p * Math.PI) / 3 + (i * 0.18);
    dots.push([cx + r * dist * Math.cos(angle), cy + r * dist * Math.sin(angle)]);
  }

  // Center mark — 0=none, 1=dot, 2=plus, 3=ring.
  const center = h % 4;

  const sw = size * 0.05;       // hex stroke width
  const csw = size * 0.04;      // chord stroke width

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      {/* Hexagon frame */}
      <polygon
        points={hexPath}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      {/* Hidden rune layer — drawn at low opacity beneath the
          chord lines and dots, which partially obscure it so the
          rune reads as part of the geometry rather than as a
          stamped letter. A reader who knows Elder Futhark will
          spot it; everyone else sees pattern. */}
      {runeLines.map((line, i) => {
        const points = line.map(([x, y]) => {
          const tx = runeOffsetX + x * runeUnit;
          const ty = runeOffsetY + y * runeUnit;
          return `${tx.toFixed(1)},${ty.toFixed(1)}`;
        }).join(" ");
        return (
          <polyline
            key={`rune${i}`}
            points={points}
            fill="none"
            stroke={color}
            strokeWidth={runeStrokeWidth}
            strokeOpacity="0.32"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
      {/* Chord lines */}
      {chords.map(([a, b], i) => (
        <line
          key={`c${i}`}
          x1={verts[a][0].toFixed(1)} y1={verts[a][1].toFixed(1)}
          x2={verts[b][0].toFixed(1)} y2={verts[b][1].toFixed(1)}
          stroke={color}
          strokeWidth={csw}
          strokeOpacity="0.72"
          strokeLinecap="round"
        />
      ))}
      {/* Dots */}
      {dots.map(([x, y], i) => (
        <circle
          key={`d${i}`}
          cx={x.toFixed(1)} cy={y.toFixed(1)} r={size * 0.055}
          fill={color}
          fillOpacity="0.85"
        />
      ))}
      {/* Center mark */}
      {center === 1 && (
        <circle cx={cx} cy={cy} r={size * 0.085} fill={color} />
      )}
      {center === 2 && (
        <g stroke={color} strokeWidth={sw} strokeLinecap="round">
          <line x1={cx - size * 0.10} y1={cy} x2={cx + size * 0.10} y2={cy} />
          <line x1={cx} y1={cy - size * 0.10} x2={cx} y2={cy + size * 0.10} />
        </g>
      )}
      {center === 3 && (
        <circle
          cx={cx} cy={cy} r={size * 0.105}
          fill="none" stroke={color} strokeWidth={csw}
        />
      )}
    </svg>
  );
};

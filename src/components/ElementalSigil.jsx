/* ──────────────────────────────────────────────────────────────
   components/ElementalSigil.jsx — procedural per-elemental mark.

   Hash the elemental's id into a small SVG signet inside a
   hexagonal frame. Stable per-elemental (same id → same sigil),
   so every appearance of "A Mist Heron" carries the same mark
   and the user reads it as that elemental's identity.

   Base shape: hexagon outline. Decorations seeded from the hash:
     - 1–2 chord lines connecting hex vertices
     - 2–3 small dots at hashed positions inside
     - A center mark (none / dot / plus / ring)

   That gives roughly 15 chord combos × 30 dot placements × 4
   center marks ≈ thousands of unique sigils — wide enough that
   no two earned elementals collide visually in a typical
   bestiary.

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

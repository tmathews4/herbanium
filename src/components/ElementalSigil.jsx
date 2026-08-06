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
   reasonable elementals.

   Stroke color comes from the caller (use rarity tone) so the
   sigil ties into the existing common/uncommon/rare/legendary
   visual system.
   ────────────────────────────────────────────────────────────── */

import React from "react";
// Uses the shared deterministic hash — see helpers/misc. Four copies
// of this existed; the values are identical, verified sample-by-sample.
import { hashString } from "../helpers/misc";

// Cheap deterministic hash. Same string → same number, every run.

// Elder Futhark runes — each defined as an array of polylines
// inside a 4-wide × 6-tall coordinate box centered at (2, 3).
// Standard rune forms (Wikipedia "Elder Futhark"). Sowilo (ᛊ)
// and Othala (ᛟ) are deliberately omitted because both have been
// co-opted by hate groups; the remaining 22 carry the alphabet's
// older, broader register.
const RUNES = {
  // Fehu ᚠ — cattle, wealth. Branches extended along their
  // original slope to x=8 (well past the rune box and hex
  // perimeter) so the clipPath cuts them cleanly at the hex
  // upper-right edge — without the extension the geometric
  // endpoint at x=4 (cx+0.67r) sits INSIDE the hex's right
  // perimeter (cx+0.87r), and the line stops short of the
  // frame instead of meeting it.
  fehu: [
    [[2, 0], [2, 6]],
    [[2, 0.6], [8, -2.4]],
    [[2, 2.2], [8, -0.8]],
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
  // Ansuz ᚨ — divine breath. Branches extended along their
  // original slope to x=8 (well past the rune box) so the hex
  // clip cuts them at the right perimeter — without the extension
  // the endpoints at x=4 (cx+0.67r) sit inside the hex's right
  // face (cx+0.87r) and the lines stop short of the frame.
  ansuz: [
    [[1.5, 0], [1.5, 6]],
    [[1.5, 0.8], [8, 2.36]],
    [[1.5, 2.4], [8, 3.96]],
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

// Adjective → sigil color. Each elemental's signet draws its
// stroke from the feel of its name word — Ember reads as fire,
// Frost as cyan, Onyx as deep, Sage as moss-green. Picks from the
// vibrant gem palette already used by the mood-crystal renderer
// so the elementals's sigils sit in the same color family as the
// crystal at the top of the screen.
//
// Unknown adjectives fall back to whatever color the caller
// passes in (typically the rarity tone), so the system degrades
// gracefully if a new adjective is added without a mapping.
const ADJECTIVE_COLORS = {
  // Warm / fire / sunset
  Sunfire:        "#FF7A4C",
  Ember:          "#FF7A4C",
  Sunset:         "#FF7A4C",
  Blaze:          "#FF7A4C",
  Fire:           "#FF4A2D",
  Cinder:         "#FF7A4C",
  Carnelian:      "#FF7A4C",
  Coral:          "#FF7A4C",
  Cinnabar:       "#FF4A2D",
  Bloodstone:     "#FF4A2D",
  Garnet:         "#FF4A2D",
  Ruby:           "#FF4A2D",
  Copper:         "#FF7A4C",

  // Sun / amber / yellow
  Sun:            "#FFC318",
  Sunstone:       "#FFC318",
  Daybreak:       "#FFC318",
  Light:          "#FFDF5A",
  Glow:           "#FFDF5A",
  Glare:          "#FFDF5A",
  Star:           "#FFDF5A",
  Crescent:       "#FFDF5A",
  Citrine:        "#FFC318",
  Amber:          "#FFC318",
  Topaz:          "#FFDF5A",
  Honeycalcite:   "#FFDF5A",
  "Imperial-Topaz": "#FFC318",
  Goldstone:      "#FFC318",
  Tigereye:       "#FFC318",
  Gold:           "#FFC318",
  Pyrite:         "#FFC318",

  // Floral / pink / rose
  Aurora:         "#FF8DC3",
  Bloom:          "#FF8DC3",
  Pearl:          "#FF8DC3",
  "Rose-Quartz":  "#FF8DC3",

  // Atmospheric / cool / silver
  Mist:           "#A8C4CB",
  Vapor:          "#A8C4CB",
  Fog:            "#8FA8B0",
  Cloud:          "#A8C4CB",
  Brume:          "#A8C4CB",
  Hush:           "#C0D2AB",
  Wind:           "#A8C4CB",
  Opal:           "#A8C4CB",
  Diamond:        "#A8C4CB",
  Crystal:        "#A8C4CB",
  Quartz:         "#C0D2AB",
  Marble:         "#A89968",
  Agate:          "#A89968",
  Moonstone:      "#C0D2AB",

  // Cool — mint / aqua / teal / cyan
  Frost:          "#4FECF0",
  Aquamarine:     "#4FECF0",
  Turquoise:      "#3FD3D7",
  Dew:            "#5DD4D9",
  Drizzle:        "#74A8B3",
  Rain:           "#74A8B3",
  Tide:           "#2EB7DC",
  River:          "#3EBAFF",
  Sky:            "#3EBAFF",
  Lightning:      "#3EBAFF",

  // Green — leaf / sage / jade
  Sage:           "#97B47B",
  Meadow:         "#7CE049",
  Bramble:        "#7CE049",
  Wood:           "#B58E55",
  Earth:          "#B58E55",
  Jade:           "#7CE049",
  Emerald:        "#4DEB7E",
  Beryl:          "#7CE049",

  // Dusk / sleep / violet
  Twilight:       "#C77FFF",
  Dusk:           "#9684C8",
  Midnight:       "#7E68A8",
  Storm:          "#7E68A8",
  Nightshade:     "#9684C8",

  // Smoke / dark / shadow
  Smoke:          "#9684C8",
  Shadow:         "#7E68A8",
  Ash:            "#9684C8",
  "Smoky-Quartz": "#7E68A8",
  Slate:          "#7E68A8",
  Hematite:       "#7E68A8",
  Onyx:           "#3A3045",
  Obsidian:       "#3A3045",
  Coal:           "#3A3045",
  Void:           "#3A3045",

  // Stone / earth-mineral
  Stone:          "#A89968",
  Granite:        "#9684C8",
  Jasper:         "#B58E55",
  Sandstone:      "#A89968",
  Mookaite:       "#B58E55",

  // Sleep / moon
  Moon:           "#C0D2AB",
};

/**
 * Resolve an elemental's sigil-stroke color from its adjective.
 * Falls back to the supplied default (typically the rarity tone)
 * when the adjective is missing or not in the lookup table.
 */
export function sigilColorFor(elemental, fallback) {
  const adj = elemental?.adjective;
  if (adj && ADJECTIVE_COLORS[adj]) return ADJECTIVE_COLORS[adj];
  return fallback;
}

export const ElementalSigil = ({
  elemental,
  size = 24,
  color = "#796E5B",
}) => {
  const seed = `${elemental?.id || elemental?.displayName || "anon"}|sigil`;
  let h = hashString(seed);

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
  //
  // Scale so the 4×6 rune box matches the hex's 2r height (i.e.
  // top-of-rune = top point of hex, bottom-of-rune = bottom point
  // of hex). Rune endpoints at y=0 / y=6 / x=0 / x=4 of the rune
  // box thus extend out toward the hex border; the SVG clipPath
  // below crops them exactly at the hex perimeter. Lines whose
  // endpoints sit inside the box (e.g. Naudhiz's diagonal slash)
  // stay short — that's the "some lines reach the border, some
  // don't" effect the geometry should produce naturally.
  const runeIdx = h % RUNE_KEYS.length; h = Math.floor(h / RUNE_KEYS.length);
  const runeLines = RUNES[RUNE_KEYS[runeIdx]];
  const runeUnit = (2 * r) / 6;             // matches hex height
  const runeOffsetX = cx - 2 * runeUnit;
  const runeOffsetY = cy - 3 * runeUnit;
  const runeStrokeWidth = Math.max(0.6, size * 0.03);
  // useId guarantees a unique clipPath id per sigil instance, so
  // multiple sigils on the same page (tile + detail card) don't
  // collide on the same document-level <clipPath id="…">.
  const reactId = React.useId();
  const clipId = `sigil-clip-${reactId.replace(/[^a-zA-Z0-9]/g, "_")}`;

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
      <defs>
        {/* Clip the rune to the hexagon outline so any rune
            stroke that runs to a box edge lands exactly on the
            hex perimeter — turning rune endpoints at the box's
            top/bottom/sides into "extends to the border" cuts. */}
        <clipPath id={clipId}>
          <polygon points={hexPath} />
        </clipPath>
      </defs>
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
          spot it; everyone else sees pattern. Clipped to the hex
          so border-reaching rune strokes terminate at the
          frame, not in mid-air outside it.
          Opacity is applied to the wrapping <g>, not to each
          polyline's strokeOpacity, so where rune lines cross or
          share endpoints they don't composite onto each other
          and produce darker intersection points — the whole rune
          fades uniformly as a single rendered group. */}
      <g clipPath={`url(#${clipId})`} opacity="0.42">
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
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
      </g>
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

/* ──────────────────────────────────────────────────────────────
   components/icons.jsx — botanical line-art SVG icons

   Small SVG components used throughout the app for decorative and
   semantic marking. Each accepts size (or width) and color props with
   theme-appropriate defaults so they fit wherever they're placed
   without having to specify them explicitly.

   THE CATEGORY GLYPHS ARE TAXONOMY, NOT DECORATION. Three of these
   say what an ingredient IS, at five call sites and four sizes each,
   and they are not free to reuse as ornament:

   - Sprig: upright stem with opposing leaves — herbal AND adaptogen
     (sage / plum respectively). Also a badge in ATTRIBUTE_GLYPHS.
   - Flower: compass-rose-style bloom — flower-category ingredients
   - Leaf: simple pointed leaf — true-tea category

   The tab bar's four icons name their screen's activity instead:

   - Kettle: Home — also the Steep screen and brew CTAs
   - Flask: Apothecary — blending, the "experiment" CTA on Home
   - Pencil: Journal
   - PottedSprig: Profile — see its own note below for why this one
     had to be drawn rather than borrowed

   - Ornament: horizontal decorative divider with central dot — used
     to visually separate sections, typographic flourish

   Below those: mood icons (MOOD_ICONS) and the generic badge glyphs
   that broaden the vocabulary for the 80+ attributes
   (ATTRIBUTE_GLYPHS).

   All are pure functional components with no state. Safe to use in
   any render context.
   ────────────────────────────────────────────────────────────── */

import React from "react";
import { theme } from "../theme";

export const Pencil = ({ size = 12, c = theme.ash }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21 L7 20 L20 7 L17 4 L4 17 Z" />
    <path d="M14 7 L17 10" />
  </svg>
);

export const Sprig = ({ size = 20, c = theme.sage }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22 V4" />
    <path d="M12 9 C8 9 6 6 6 5" />
    <path d="M12 13 C8.5 13 7 11 7 10" />
    <path d="M12 17 C9 17 7.5 15 7.5 14" />
    <path d="M12 8 C15.5 8 17.5 6 18 5" />
    <path d="M12 12 C16 12 18 10 18 9" />
    <path d="M12 16 C15.5 16 17 14 17 13" />
  </svg>
);

export const Flower = ({ size = 22, c = theme.ochre }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="2.2" />
    <path d="M12 3 V7" />
    <path d="M12 17 V21" />
    <path d="M3 12 H7" />
    <path d="M17 12 H21" />
    <path d="M5.5 5.5 L8.3 8.3" />
    <path d="M15.7 15.7 L18.5 18.5" />
    <path d="M5.5 18.5 L8.3 15.7" />
    <path d="M15.7 8.3 L18.5 5.5" />
  </svg>
);

export const Leaf = ({ size = 20, c = theme.sageDeep }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20 C4 10 10 4 20 4 C20 14 14 20 4 20 Z" />
    <path d="M4 20 L20 4" />
  </svg>
);

// Erlenmeyer-shaped flask — narrow neck, sloped shoulders, wide
// flat base. Used for the "experiment" CTA on Home so the icon
// reads as lab/blending work.
export const Flask = ({ size = 22, c = theme.ochre }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3 H15" />
    <path d="M10 3 V9 L5 19 C4.5 20 5 21 6 21 H18 C19 21 19.5 20 19 19 L14 9 V3" />
    <path d="M7.5 15 H16.5" />
  </svg>
);

export const Kettle = ({ size = 22, c = theme.ink }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 11 H19 L18 19 C17.8 20 17 20.5 16 20.5 H8 C7 20.5 6.2 20 6 19 Z" />
    <path d="M9 11 C9 8 10.5 6.5 12 6.5 C13.5 6.5 15 8 15 11" />
    <path d="M19 13 L22 11 L22 15 Z" />
    <path d="M11 4 Q11 2 13 2" />
    <path d="M4 20 L20 20" />
  </svg>
);

// Thumbs-up — line-art hand silhouette in the same register as the
// other interface icons (24×24 viewBox, 1.1 stroke, rounded caps).
// Two paths: a small wrist/cuff rectangle + the larger hand-with-
// thumb shape above it.
export const ThumbUp = ({ size = 18, c = theme.sageDeep }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21 L3 12 L7 12 L7 21 Z" />
    <path d="M7 12 L10.5 4 C10.7 3.4 11.4 3 12 3 C12.8 3 13.3 3.6 13.3 4.4 V11 H19 C20 11 20.5 11.7 20.4 12.5 L19.3 19 C19.1 20.2 18 21 16.7 21 L7 21 Z" />
  </svg>
);

// Thumbs-down — same shape rotated 180° around the icon center
// so the wrist sits at the top and the thumb points down. Default
// color leans terra so it reads as the warning/no register.
export const ThumbDown = ({ size = 18, c = theme.terra }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
    <g transform="rotate(180 12 12)">
      <path d="M3 21 L3 12 L7 12 L7 21 Z" />
      <path d="M7 12 L10.5 4 C10.7 3.4 11.4 3 12 3 C12.8 3 13.3 3.6 13.3 4.4 V11 H19 C20 11 20.5 11.7 20.4 12.5 L19.3 19 C19.1 20.2 18 21 16.7 21 L7 21 Z" />
    </g>
  </svg>
);

// PottedSprig — the Profile tab's icon: a sprig growing in a pot.
//
// It exists because Profile used to borrow Sprig itself, and Sprig is
// TAXONOMY — it marks herbal and adaptogen ingredients across the
// sheet, the detail screen and the library, and it's a badge in
// ATTRIBUTE_GLYPHS besides. One mark meant "this is an herb" in the
// catalog and "this is you" in the tab bar. The pot is the whole
// distinction: a cut specimen is a category, a planted one is yours.
//
// A CONSTELLATION WAS TRIED FIRST AND LOST TO MEASUREMENT, which is
// worth recording because the argument for it was good. Profile's
// centerpiece is TeaConstellation, so an icon of joined stars would
// have named the screen the way Kettle, Flask and Pencil name theirs.
// Rendered at the size it actually ships at, four variants all failed:
// a joined zigzag reads as a line chart, a hub-and-spokes reads as an
// X (a close button, in a tab bar), a branched asterism goes ambiguous
// below ~30px, and loose dots read as noise. The idea drew worse than
// it argued. Don't re-derive it without rendering it at 18px first.
//
// The pot is a flat trapezoid with a rim line, deliberately unlike
// Flask's conical body and neck — the two sit three tabs apart and
// must not be confused. Two leaves only: Sprig's six would fill in to
// a smudge at 18px.
//
// The leaves are CLOSED almond shapes, not the open curved strokes
// Sprig uses, and they're deliberately unequal — smaller left, larger
// right. Both matter at 18px. Open strokes read as bare twigs once
// they're two pixels long, and a symmetric pair reads as a mechanical
// arrow; the offset pair reads as a growing thing.
//
// THEY ARE FILLED, and that is the part not to "clean up" later. Every
// other icon in this file is pure outline, so a filled shape looks
// inconsistent in the source — but an outlined leaf this size closes
// to a single line at tab scale, which is exactly how it was reported.
// Widening the outline helped and didn't fix it; the fill does, and it
// still holds at 14px. The pot stays stroked so the mark still reads
// as one of this family rather than a solid glyph.
//
// Midribs were tried and dropped. They look better at 68px and turn to
// mush at 18px, which is the only size this ships at.
//
// FILL THE BOX. The first version was drawn inside a smaller area than
// the register uses and shipped looking underweight next to its
// neighbors — reported as "a little small", and it was. Measured with
// getBBox inside the 24×24 viewBox:
//
//   Kettle 18 × 18.5 = 333    Pencil 17 × 17   = 289
//   Flask  14.4 × 18 = 259    Sprig  12 × 18   = 216
//   this   13.2 × 17.6 = 233  (was 10.4 × 14.3 = 149)
//
// So the tab had LOST weight in the swap — 149 against the 216 Sprig
// it replaced, 45% of Kettle. Size props don't reveal this; every icon
// is nominally 18px and the artwork inside differs. Any new icon here
// should be measured against that table rather than eyeballed.
export const PottedSprig = ({ size = 20, c = theme.sage }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 13.5 V6.6" />
    <path fill={c} d="M12 10 C11.79 7.78 9.44 6.18 7.3 6.8 C7.51 9.02 9.86 10.62 12 10 Z" />
    <path fill={c} d="M12 7.3 C14.61 8.06 17.46 6.11 17.7 3.4 C15.09 2.64 12.24 4.59 12 7.3 Z" />
    <path d="M5.4 13.5 H18.6" />
    <path d="M6.7 13.5 L8.1 21 H15.9 L17.3 13.5" />
  </svg>
);

export const Ornament = ({ w = 120, c = theme.rule }) => (
  <svg width={w} height="12" viewBox="0 0 120 12" fill="none" stroke={c} strokeWidth="0.8" strokeLinecap="round">
    <path d="M0 6 H44" />
    <path d="M76 6 H120" />
    <circle cx="60" cy="6" r="2.2" fill={c} stroke="none" />
    <path d="M50 6 Q55 2 60 6 Q65 10 70 6" />
  </svg>
);

/* ── Mood icons — one per mood, used in BlendDetail hero ────────── */

export const MoodCalm = ({ size = 28, c = theme.sage }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9 Q7 5 12 9 T21 9" />
    <path d="M3 15 Q7 11 12 15 T21 15" />
  </svg>
);

export const MoodFocus = ({ size = 28, c = theme.sageDeep }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.6" fill={c} stroke="none" />
  </svg>
);

export const MoodEnergy = ({ size = 28, c = theme.ochre }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2 V5" />
    <path d="M12 19 V22" />
    <path d="M2 12 H5" />
    <path d="M19 12 H22" />
    <path d="M4.9 4.9 L7 7" />
    <path d="M17 17 L19.1 19.1" />
    <path d="M4.9 19.1 L7 17" />
    <path d="M17 7 L19.1 4.9" />
  </svg>
);

export const MoodSleepy = ({ size = 28, c = theme.plum }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 15 A8.5 8.5 0 1 1 9 4 A7 7 0 0 0 20 15 Z" />
  </svg>
);

export const MoodComfort = ({ size = 28, c = theme.terra }) => (
  // Clean teacup silhouette — rounded shoulders (no square H17 V18
  // corners) and just two steam wisps so the icon stays uncluttered
  // at small sizes. Reads as a cup-on-saucer at a glance.
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 11 H17 V17 C17 19 16 20 14 20 H8 C6 20 5 19 5 17 Z" />
    <path d="M17 12.5 C19 12.5 20 14 20 15.5 C20 17 19 18.5 17 18.5" />
    <path d="M10 8 C10.5 6.5 10 5 9.5 3.5" />
    <path d="M14 8 C14.5 6.5 14 5 13.5 3.5" />
  </svg>
);

export const MoodSoothing = ({ size = 28, c = theme.sage }) => (
  // Two nested smile-arcs — cradling shape that reads "wrapped" or
  // "held" without recycling the calm waves. Distinct from calm
  // (which uses two horizontal waves) by using vertically stacked
  // concentric curves instead.
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9 C8 14 16 14 21 9" />
    <path d="M5.5 14 C9 17 15 17 18.5 14" />
  </svg>
);

export const MoodWarming = ({ size = 28, c = theme.terra }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    {/* outer flame */}
    <path d="M12 22 C6 22 4 17 5.5 13 C7 9.5 9 9 9 6 C9 4 11 2.5 12 2 C13 4 14 5 14 7.5 C14 9 13 10 13 11 C13 12 14 12.5 15 11.5 C16 10.5 16 9 16 9 C18 11 19 14 18 17 C17 20 14.5 22 12 22 Z" />
    {/* inner flame */}
    <path d="M12 18 C9.5 18 9 15.5 10 13.5 C11 11.5 12 11 12 9 C13 11 13.5 13 13 14.5 C12.5 16.5 13 17 14 16.5" />
  </svg>
);

export const MoodCooling = ({ size = 28, c = theme.sky || theme.sage }) => (
  // Clean 6-arm snowflake — dropped the per-arm barb decorations
  // that previously cluttered the icon at small sizes. Three crossing
  // axes with small terminal dots; geometric and crisp.
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3 V21" />
    <path d="M4 7.5 L20 16.5" />
    <path d="M4 16.5 L20 7.5" />
    <circle cx="12" cy="3" r="0.7" fill={c} stroke="none" />
    <circle cx="12" cy="21" r="0.7" fill={c} stroke="none" />
    <circle cx="4" cy="7.5" r="0.7" fill={c} stroke="none" />
    <circle cx="20" cy="16.5" r="0.7" fill={c} stroke="none" />
    <circle cx="4" cy="16.5" r="0.7" fill={c} stroke="none" />
    <circle cx="20" cy="7.5" r="0.7" fill={c} stroke="none" />
  </svg>
);

export const MoodDigestive = ({ size = 28, c = theme.ochre }) => (
  // Concentric ripples — reads as a settled stomach. The previous
  // version used arc commands with a near-zero (0.01) displacement
  // to fake closed circles, which some renderers drew as slivers
  // hugging the top of the canvas instead of full rings. Plain
  // <circle> elements render unambiguously and stay centered.
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="12" r="3.5" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="9" />
  </svg>
);

export const MoodGrounding = ({ size = 28, c = theme.terra }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    {/* mountain silhouette */}
    <path d="M2 19 L9 9 L13 14 L17 8 L22 19 Z" />
    <path d="M2 19 H22" />
  </svg>
);

export const MoodUplifting = ({ size = 28, c = theme.ochre }) => (
  // Rising chevron-on-stem — a clean upward arrow that reads
  // "lifting" without the previous version's two-leaf shape that
  // looked more like wings than a sprout. Distinct from energy
  // (sun) and calm (waves); the only directional icon in the set.
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21 V5" />
    <path d="M7 10 L12 5 L17 10" />
  </svg>
);

/* ── Generic glyphs for attributes/badges — broaden the icon vocab
   beyond mood icons so the 80+ attributes don't all look alike. ── */

export const GlyphStar = ({ size = 28, c = theme.ochre }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3 L14.6 9.5 L21.5 10.1 L16.2 14.6 L17.8 21.4 L12 17.8 L6.2 21.4 L7.8 14.6 L2.5 10.1 L9.4 9.5 Z" />
  </svg>
);

export const GlyphHeart = ({ size = 28, c = theme.terra }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21 C5 16.5 3 12.5 3 9 C3 6 5.5 4 8 4 C10 4 11.5 5 12 7 C12.5 5 14 4 16 4 C18.5 4 21 6 21 9 C21 12.5 19 16.5 12 21 Z" />
  </svg>
);

export const GlyphCompass = ({ size = 28, c = theme.sageDeep }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M14 8 L12 14 L10 16 L12 10 Z" />
    <circle cx="12" cy="12" r="1.2" fill={c} stroke="none" />
  </svg>
);

export const GlyphKey = ({ size = 28, c = theme.ochre }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="12" r="4.5" />
    <path d="M12.5 12 H21" />
    <path d="M17 12 V16" />
    <path d="M20 12 V15" />
  </svg>
);

export const GlyphFeather = ({ size = 28, c = theme.plum }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 19 L19 5" />
    <path d="M19 5 C16 3 11 4 8 8 C5 12 5 17 5 19 C7 19 12 19 16 16 C20 13 21 8 19 5 Z" />
    <path d="M9 13 H14" />
  </svg>
);

export const GlyphMortar = ({ size = 28, c = theme.terra }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 11 H19" />
    <path d="M6 11 L8 19 H16 L18 11" />
    <path d="M14 11 L18 4" />
  </svg>
);

export const GlyphBee = ({ size = 28, c = theme.ochre }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="14" rx="5" ry="6" />
    <path d="M9 11 H15" />
    <path d="M9 14 H15" />
    <path d="M9 17 H15" />
    <path d="M7 9 C5 7 5 5 7 4" />
    <path d="M17 9 C19 7 19 5 17 4" />
  </svg>
);

export const GlyphRoot = ({ size = 28, c = theme.terra }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3 V12" />
    <path d="M12 12 C8 14 6 18 5 21" />
    <path d="M12 12 C16 14 18 18 19 21" />
    <path d="M12 12 C12 16 11 19 10 21" />
    <path d="M12 12 C12 16 13 19 14 21" />
  </svg>
);

export const GlyphScroll = ({ size = 28, c = theme.ash }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 5 H17 C19 5 19 8 17 8 H7 C5 8 5 5 5 5 Z" />
    <path d="M7 8 V19 C7 20 8 21 9 21 H17 C19 21 19 18 17 18 H9" />
    <path d="M19 8 V18" />
  </svg>
);

export const GlyphDroplet = ({ size = 28, c = theme.sky || theme.sage }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3 C8 8 5 12 5 15 C5 19 8 21 12 21 C16 21 19 19 19 15 C19 12 16 8 12 3 Z" />
  </svg>
);

// Map mood → component for the BlendDetail hero. Anything not in the map
// falls back to Flower so user-composed/synth blends still get an icon.
export const MOOD_ICONS = {
  calm:      MoodCalm,
  focus:     MoodFocus,
  energy:    MoodEnergy,
  sleepy:    MoodSleepy,
  comfort:   MoodComfort,
  soothing:  MoodSoothing,
  warming:   MoodWarming,
  cooling:   MoodCooling,
  digestive: MoodDigestive,
  grounding: MoodGrounding,
  uplifting: MoodUplifting,
};

// Combined registry — used by the attribute panel to look up by glyph key.
export const ATTRIBUTE_GLYPHS = {
  calm: MoodCalm, focus: MoodFocus, energy: MoodEnergy, sleepy: MoodSleepy,
  comfort: MoodComfort, soothing: MoodSoothing, warming: MoodWarming,
  cooling: MoodCooling, digestive: MoodDigestive, grounding: MoodGrounding,
  uplifting: MoodUplifting,
  flower: Flower, sprig: Sprig, leaf: Leaf, kettle: Kettle,
  star: GlyphStar, heart: GlyphHeart, compass: GlyphCompass, key: GlyphKey,
  feather: GlyphFeather, mortar: GlyphMortar, bee: GlyphBee, root: GlyphRoot,
  scroll: GlyphScroll, droplet: GlyphDroplet,
};

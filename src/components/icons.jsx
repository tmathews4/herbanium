/* ──────────────────────────────────────────────────────────────
   components/icons.jsx — botanical line-art SVG icons

   Five small SVG components used throughout the app for decorative
   and semantic marking. Each accepts size (or width) and color props
   with theme-appropriate defaults so they fit wherever they're placed
   without having to specify them explicitly.

   - Sprig: upright stem with opposing leaves — generic herbal marker
   - Flower: compass-rose-style bloom — ochre by default, used for
     flower-category ingredients and accent decoration
   - Leaf: simple pointed leaf — used for true-tea category
   - Kettle: small kettle icon — used on the Steep screen and brew CTAs
   - Ornament: horizontal decorative divider with central dot — used
     to visually separate sections, typographic flourish

   All are pure functional components with no state. Safe to use in
   any render context.
   ────────────────────────────────────────────────────────────── */

import React from "react";
import { theme } from "../theme";

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

export const Kettle = ({ size = 22, c = theme.ink }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 11 H19 L18 19 C17.8 20 17 20.5 16 20.5 H8 C7 20.5 6.2 20 6 19 Z" />
    <path d="M9 11 C9 8 10.5 6.5 12 6.5 C13.5 6.5 15 8 15 11" />
    <path d="M19 13 L22 11 L22 15 Z" />
    <path d="M11 4 Q11 2 13 2" />
    <path d="M4 20 L20 20" />
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
    <path d="M19 14.5 A8 8 0 1 1 9.5 5 A6 6 0 0 0 19 14.5 Z" />
    <circle cx="6" cy="6" r="0.8" fill={c} stroke="none" />
    <circle cx="20" cy="20" r="0.8" fill={c} stroke="none" />
  </svg>
);

export const MoodComfort = ({ size = 28, c = theme.terra }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    {/* cup */}
    <path d="M5 12 H17 V18 C17 19.5 16 20.5 14.5 20.5 H7.5 C6 20.5 5 19.5 5 18 Z" />
    <path d="M17 13 C19 13 20 14 20 15.5 C20 17 19 18 17 18" />
    {/* steam */}
    <path d="M9 8 Q10 6 9 4" />
    <path d="M12 8 Q13 6 12 4" />
    <path d="M15 8 Q16 6 15 4" />
  </svg>
);

export const MoodSoothing = ({ size = 28, c = theme.sage }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8 Q7 5 12 8 T21 8" />
    <path d="M3 12 Q7 9 12 12 T21 12" />
    <path d="M3 16 Q7 13 12 16 T21 16" />
    <path d="M3 20 Q7 17 12 20 T21 20" />
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
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    {/* 6-pointed snowflake */}
    <path d="M12 2 V22" />
    <path d="M3.5 7 L20.5 17" />
    <path d="M3.5 17 L20.5 7" />
    {/* small barbs */}
    <path d="M12 5 L10.5 6.5 M12 5 L13.5 6.5" />
    <path d="M12 19 L10.5 17.5 M12 19 L13.5 17.5" />
    <path d="M5.5 8.5 L7.5 9 M5.5 8.5 L6 6.5" />
    <path d="M18.5 15.5 L16.5 15 M18.5 15.5 L18 17.5" />
    <path d="M5.5 15.5 L7.5 15 M5.5 15.5 L6 17.5" />
    <path d="M18.5 8.5 L16.5 9 M18.5 8.5 L18 6.5" />
  </svg>
);

export const MoodDigestive = ({ size = 28, c = theme.ochre }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    {/* spiral */}
    <path d="M12 12 m0 -1 a1 1 0 1 1 0.01 0 M12 12 m0 -3 a3 3 0 1 1 0.01 0 M12 12 m0 -5 a5 5 0 1 1 0.01 0 M12 12 m0 -7.5 a7.5 7.5 0 1 1 0.01 0" />
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
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    {/* leaf with rising stem */}
    <path d="M12 22 V10" />
    <path d="M12 10 C7 10 4 7 4 3 C9 3 12 5 12 10 Z" />
    <path d="M12 10 C17 10 20 7 20 3 C15 3 12 5 12 10 Z" />
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

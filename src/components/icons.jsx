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

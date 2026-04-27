/* ──────────────────────────────────────────────────────────────
   theme.js — Herbanium design tokens

   Color palette and font-family constants used across the app.
   These are the only "design system" primitives — everything else
   in the codebase composes from them.

   Themes are variants of the same token set. Components import
   `theme` and read tokens at render time; `applyTheme(variant)`
   mutates the same object reference so a tree re-render picks up
   the new values automatically. App.jsx forces that re-render by
   rotating a key on the top-level wrapper when the variant flips.
   ────────────────────────────────────────────────────────────── */

// Default daylight theme — warm parchment, ink-on-cream.
const DAY = {
  ivory:    "#F3ECDC",
  paper:    "#EAE0C7",
  cream:    "#FAF4E4",
  ink:      "#1E1812",
  inkSoft:  "#453A2C",
  ash:      "#796E5B",
  rule:     "#D2C4A3",
  ruleSoft: "#E3D7B8",
  sage:     "#6D7E55",
  sageDeep: "#4A573A",
  ochre:    "#A57836",
  terra:    "#B0542F",
  rose:     "#C37959",
  sky:      "#7F9AA0",
  plum:     "#7B4A5A",
};

// Spellbook theme — dark leather and gilded-ink. Tokens keep their
// semantic names: ivory/paper/cream become deep surfaces, ink/ash
// become luminous foreground, accents stay legible against dark.
const SPELLBOOK = {
  ivory:    "#1B160F", // outer background — old leather
  paper:    "#241D14", // mid surface
  cream:    "#2E2618", // page surface (cards, panels)
  ink:      "#EFE2BE", // gilded ink (primary text)
  inkSoft:  "#D2BF8E",
  ash:      "#9B8B6B", // faded gold (secondary text)
  rule:     "#5A4A30",
  ruleSoft: "#3D311F",
  sage:     "#8AA372", // mossier green that pops on dark
  sageDeep: "#B5CDA0",
  ochre:    "#D9AC55", // candlelight
  terra:    "#C8623A", // witch-fire
  rose:     "#D78870",
  sky:      "#8AA9C4", // moonlight
  plum:     "#B78097", // ritual plum
};

const THEMES = { day: DAY, spellbook: SPELLBOOK };

export const THEME_VARIANTS = Object.keys(THEMES);

// Mutable theme object — components import this and read at render
// time. applyTheme replaces every key in place so the same reference
// continues to work everywhere it's used, but renders see the new
// values. Default to DAY at module load.
export const theme = { ...DAY };

export function applyTheme(variant) {
  const next = THEMES[variant] || THEMES.day;
  Object.keys(next).forEach(k => { theme[k] = next[k]; });
}

export const ff = {
  serif: `"Fraunces", "Cormorant Garamond", Georgia, serif`,
  sans:  `"Instrument Sans", "Inter", system-ui, sans-serif`,
  mono:  `"JetBrains Mono", ui-monospace, monospace`,
};

/* ──────────────────────────────────────────────────────────────
   theme.js — Herbanium design tokens

   Color palette and font-family constants used across the app.
   These are the only "design system" primitives — everything else
   in the codebase composes from them.

   Kept deliberately small; any new token added here propagates to
   every consumer automatically.
   ────────────────────────────────────────────────────────────── */

export const theme = {
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

export const ff = {
  serif: `"Fraunces", "Cormorant Garamond", Georgia, serif`,
  sans:  `"Instrument Sans", "Inter", system-ui, sans-serif`,
  mono:  `"JetBrains Mono", ui-monospace, monospace`,
};

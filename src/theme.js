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

// Soft elevation tokens — quiet shadows for cards and lifted controls.
// Kept warm and shallow; the app's ink-on-cream palette can't carry hard
// modern drop shadows without looking out of register.
export const shadow = {
  // Resting state: barely-there warmth under cards. Reads as "this is
  // a surface, not a flat region of the page."
  card:    "0 1px 2px rgba(30, 24, 18, 0.04), 0 1px 1px rgba(30, 24, 18, 0.03)",
  // Lifted: a tile or tappable that wants to read as pressable.
  lifted:  "0 2px 4px rgba(30, 24, 18, 0.06), 0 1px 2px rgba(30, 24, 18, 0.04)",
  // Pressed/hover lift: doubles the resting depth, no offset shift so
  // the tile doesn't visibly jump.
  hover:   "0 3px 8px rgba(30, 24, 18, 0.08), 0 1px 2px rgba(30, 24, 18, 0.05)",
  // Inset for selected/depressed buttons — feels like the surface
  // accepts the tap rather than rebounding off it.
  pressed: "inset 0 1px 2px rgba(30, 24, 18, 0.10)",

  // Filled-CTA shadow recipes. The card tokens above use a near-black
  // ink shadow at 4-8% opacity, which disappears on a saturated fill.
  // Filled buttons need a stronger, color-tinted drop to read as
  // elevation. Three variants (rest / hover / press) per tint.
  //
  // Tuned to a middle weight: deep enough to read on a saturated
  // background (the prior 0.40 alpha on Brew/Log it pushed forward
  // too much, dominating the page), light enough to actually show
  // on the compose buttons that previously appeared flat.
  btn: {
    // Terra-filled buttons (Start brewing, Brew this cup, primary CTAs)
    terra: {
      rest:  "0 4px 10px -2px rgba(176,84,47,0.28), 0 1px 3px rgba(176,84,47,0.16)",
      hover: "0 6px 14px -3px rgba(176,84,47,0.36), 0 2px 4px rgba(176,84,47,0.18)",
      press: "0 1px 3px rgba(176,84,47,0.22), inset 0 1px 2px rgba(0,0,0,0.08)",
    },
    // Terra outlined buttons (Save). Same shape as filled, slightly
    // softer alpha so the visual hierarchy is filled > outlined while
    // both clearly float above the page.
    terraOutline: {
      rest:  "0 4px 10px -2px rgba(176,84,47,0.22), 0 1px 3px rgba(176,84,47,0.12)",
      hover: "0 6px 14px -3px rgba(176,84,47,0.30), 0 2px 4px rgba(176,84,47,0.14)",
      press: "0 1px 3px rgba(176,84,47,0.16), inset 0 1px 1px rgba(176,84,47,0.06)",
    },
    // Ink-filled buttons (log it, begin →, save mood). Same shape as
    // terra but with an ink-tinted shadow so the depth reads on warm
    // dark fills.
    ink: {
      rest:  "0 4px 10px -2px rgba(30,24,18,0.22), 0 1px 3px rgba(30,24,18,0.12)",
      hover: "0 6px 14px -3px rgba(30,24,18,0.30), 0 2px 4px rgba(30,24,18,0.14)",
      press: "0 1px 3px rgba(30,24,18,0.18), inset 0 1px 2px rgba(0,0,0,0.08)",
    },
  },
};

// Standard corner radii. Drops the 3-/4-px outliers across the codebase
// onto a 4-step scale so the visual family is consistent.
export const radius = {
  sm:   6,    // tags, small chips, signal pills
  md:  10,    // cards, secondary buttons, modal sub-panels
  lg:  14,    // primary CTA tiles, hero cards
  pill: 999,  // toggle pills, filters, mood/flavor chips
};

// Shared transition timing. 150ms ease-out reads "responsive" without
// feeling sluggish; 200ms is reserved for color/background swaps where
// snapping looks harsh.
export const motion = {
  fast: "all 0.15s ease-out",
  swap: "background 0.2s ease-out, color 0.2s ease-out, border-color 0.2s ease-out",
};

// Button style helpers. Each returns an inline-style object for direct
// use in a <button>. State (active/disabled) is layered on by the
// caller — these are the resting forms.
//
// Primary: filled background, used for the single action a screen wants
// the user to take (Log it, Begin, Save).
// Secondary: outlined, for non-destructive alternatives (Cancel, Edit).
// Ghost: text-only, for header back/dismiss and tertiary affordances.
// Pill: round filter/toggle chips. Pair with a tone via `palette`.
export const buttons = {
  primary: {
    background: theme.ink,
    color: theme.cream,
    border: "none",
    borderRadius: radius.md,
    padding: "12px 22px",
    fontFamily: ff.serif,
    fontSize: 15,
    cursor: "pointer",
    transition: motion.fast,
    boxShadow: shadow.lifted,
    outline: "none",
  },
  secondary: {
    background: "transparent",
    color: theme.ink,
    border: `1px solid ${theme.rule}`,
    borderRadius: radius.md,
    padding: "10px 20px",
    fontFamily: ff.sans,
    fontSize: 12.5,
    letterSpacing: "0.04em",
    cursor: "pointer",
    transition: motion.fast,
    outline: "none",
  },
  ghost: {
    background: "transparent",
    color: theme.ash,
    border: "none",
    padding: "6px 4px",
    fontFamily: ff.sans,
    fontSize: 12,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: motion.swap,
    outline: "none",
  },
  pill: {
    background: "transparent",
    border: `1px solid ${theme.ruleSoft}`,
    borderRadius: radius.pill,
    padding: "5px 12px",
    fontFamily: ff.sans,
    fontSize: 11,
    letterSpacing: "0.04em",
    color: theme.ash,
    cursor: "pointer",
    transition: motion.swap,
    outline: "none",
  },
};

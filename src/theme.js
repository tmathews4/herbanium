/* ──────────────────────────────────────────────────────────────
   theme.js — Herbanium design tokens

   Color palette and font-family constants used across the app.
   These are the only "design system" primitives — everything else
   in the codebase composes from them.

   Kept deliberately small; any new token added here propagates to
   every consumer automatically.
   ────────────────────────────────────────────────────────────── */

// Theme tokens reference CSS variables defined in src/index.css.
// The variable values swap automatically under
// @media (prefers-color-scheme: dark), so every inline style in
// the app picks up dark mode without any per-component wiring.
// Hex literals stay only in components that need to do JS-side
// arithmetic on the value (e.g. hexToRgb in FlavorMap.jsx, where
// the family colors are local hex tables not these palette tokens).
export const theme = {
  ivory:    "var(--ivory)",
  /* The reveal wash, as a ready-made rgba rather than a raw triplet:
     both callers want the same opacity, and a second copy of 0.86 is a
     second thing to drift. See --veil-rgb in index.css for why this is
     not the dialog dim. */
  veil:     "rgba(var(--veil-rgb), 0.86)",
  paper:    "var(--paper)",
  cream:    "var(--cream)",
  ink:      "var(--ink)",
  inkSoft:  "var(--ink-soft)",
  ash:      "var(--ash)",
  rule:     "var(--rule)",
  ruleSoft: "var(--rule-soft)",
  sage:     "var(--sage)",
  sageDeep: "var(--sage-deep)",
  ochre:    "var(--ochre)",
  terra:    "var(--terra)",
  bark:     "var(--bark)",
  rose:     "var(--rose)",
  sky:      "var(--sky)",
  plum:     "var(--plum)",
};

export const ff = {
  serif: `"Fraunces", "Cormorant Garamond", Georgia, serif`,
  sans:  `"Instrument Sans", "Inter", system-ui, sans-serif`,
  mono:  `"JetBrains Mono", ui-monospace, monospace`,
};

// Soft elevation tokens — quiet shadows for cards and lifted controls.
// Shadow color is composed via the --shadow-rgb CSS variable so dark
// mode swaps to a true-black tint that still reads against warm-dark
// surfaces (the original ink-on-cream tint would disappear into a
// dark background). The inset highlights use --hi-rgb so they keep
// the right warmth in either scheme.
//
// rgba(var(--name), <alpha>) is valid CSS as long as the variable
// holds an "R, G, B" triplet; both --shadow-rgb and --hi-rgb do.
export const shadow = {
  // Resting state: barely-there depth under cards.
  card:    "0 1px 2px rgba(var(--shadow-rgb), 0.04), 0 1px 1px rgba(var(--shadow-rgb), 0.03)",
  // Lifted: a tile or tappable that wants to read as pressable.
  lifted:  "0 2px 4px rgba(var(--shadow-rgb), 0.06), 0 1px 2px rgba(var(--shadow-rgb), 0.04)",
  // Pressed/hover lift: doubles the resting depth, no offset shift so
  // the tile doesn't visibly jump.
  hover:   "0 3px 8px rgba(var(--shadow-rgb), 0.08), 0 1px 2px rgba(var(--shadow-rgb), 0.05)",
  // Inset for selected/depressed buttons.
  pressed: "inset 0 1px 2px rgba(var(--shadow-rgb), 0.10)",

  // Filled-CTA shadow recipes. Two layers per state:
  //   - inset top highlight (warm white at low alpha) — gives the
  //     button a subtle "molded" edge.
  //   - drop shadow tinted to the button's color, giving elevation.
  //
  // Calibrated quieter than the earlier glow-heavy recipe so buttons
  // read as gently lifted rather than buoyantly hovering. Outer-drop
  // alphas roughly halved; spread radii tightened; inset highlights
  // softened. Keeps real depth without the "glow" feel.
  btn: {
    // Terra-filled buttons (Start brewing, Brew this cup, primary CTAs).
    terra: {
      rest:  "inset 0 1px 0 rgba(var(--hi-rgb),0.14), 0 1px 2px rgba(176,84,47,0.16), 0 3px 8px -2px rgba(176,84,47,0.20)",
      hover: "inset 0 1px 0 rgba(var(--hi-rgb),0.18), 0 2px 4px rgba(176,84,47,0.20), 0 5px 12px -3px rgba(176,84,47,0.26)",
      press: "inset 0 1px 2px rgba(var(--shadow-rgb),0.12), 0 1px 1px rgba(176,84,47,0.12)",
    },
    // Terra outlined buttons (Save). No inset highlight — the
    // outline IS the structure. Lifted via a quiet drop shadow.
    terraOutline: {
      rest:  "0 1px 2px rgba(176,84,47,0.10), 0 3px 8px -3px rgba(176,84,47,0.14)",
      hover: "0 2px 4px rgba(176,84,47,0.14), 0 5px 12px -4px rgba(176,84,47,0.20)",
      press: "0 1px 1px rgba(176,84,47,0.10), inset 0 1px 1px rgba(176,84,47,0.06)",
    },
    // Ink-filled buttons. Drop tint follows --shadow-rgb so the
    // depth still reads on a dark surface.
    ink: {
      rest:  "inset 0 1px 0 rgba(var(--hi-rgb),0.12), 0 1px 2px rgba(var(--shadow-rgb),0.14), 0 3px 8px -2px rgba(var(--shadow-rgb),0.18)",
      hover: "inset 0 1px 0 rgba(var(--hi-rgb),0.16), 0 2px 4px rgba(var(--shadow-rgb),0.18), 0 5px 12px -3px rgba(var(--shadow-rgb),0.24)",
      press: "inset 0 1px 2px rgba(var(--shadow-rgb),0.14), 0 1px 1px rgba(var(--shadow-rgb),0.14)",
    },
    // Bark-filled buttons (the default tone). Warm-walnut drop
    // tint instead of terra-orange.
    bark: {
      rest:  "inset 0 1px 0 rgba(var(--hi-rgb),0.13), 0 1px 2px rgba(94,61,32,0.14), 0 3px 8px -2px rgba(94,61,32,0.18)",
      hover: "inset 0 1px 0 rgba(var(--hi-rgb),0.16), 0 2px 4px rgba(94,61,32,0.18), 0 5px 12px -3px rgba(94,61,32,0.24)",
      press: "inset 0 1px 2px rgba(var(--shadow-rgb),0.12), 0 1px 1px rgba(94,61,32,0.12)",
    },
    barkOutline: {
      rest:  "0 1px 2px rgba(94,61,32,0.10), 0 3px 8px -3px rgba(94,61,32,0.14)",
      hover: "0 2px 4px rgba(94,61,32,0.14), 0 5px 12px -4px rgba(94,61,32,0.20)",
      press: "0 1px 1px rgba(94,61,32,0.10), inset 0 1px 1px rgba(94,61,32,0.06)",
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

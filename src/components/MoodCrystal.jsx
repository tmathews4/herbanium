/* ──────────────────────────────────────────────────────────────
   components/MoodCrystal.jsx — the bestiary's lead crystal.

   Sits above the Elemental Bestiary as a small SVG diamond whose
   color is computed from the user's last 30 days of moods and
   flavors. Same data the wild-elemental roller already uses for
   bias — this is the visible face of that signal.

   The crystal renders even with no data (the "Neutral Crystal"
   baseline) so a fresh user sees a placeholder that earns color
   as they brew, rather than an empty box.
   ────────────────────────────────────────────────────────────── */

import React from "react";
import { ff, theme } from "../theme";
import { computeMoodCrystal } from "../data/moodCrystal";

const CrystalShape = ({ gradient, idSuffix }) => {
  const gradId = `crystal-grad-${idSuffix}`;
  const glowId = `crystal-glow-${idSuffix}`;
  const [c1, c2] = gradient;
  return (
    <svg width={72} height={84} viewBox="0 0 72 84" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"  stopColor={c1} stopOpacity="0.95" />
          <stop offset="55%" stopColor={c2} stopOpacity="0.92" />
          <stop offset="100%" stopColor={c1} stopOpacity="0.88" />
        </linearGradient>
        <radialGradient id={glowId} cx="50%" cy="40%" r="60%">
          <stop offset="0%"   stopColor="#fff" stopOpacity="0.55" />
          <stop offset="60%"  stopColor="#fff" stopOpacity="0.0" />
        </radialGradient>
      </defs>
      {/* Diamond / shard silhouette — six-faceted bipyramid in 2D.
          Coords sketch a tall hexagonal jewel: top point, two
          shoulders, two hips, bottom point. */}
      <polygon
        points="36,6 60,28 56,58 36,80 16,58 12,28"
        fill={`url(#${gradId})`}
        stroke="rgba(30,24,18,0.18)"
        strokeWidth="0.75"
      />
      {/* Inner facet edges so the shape reads as cut, not flat. */}
      <polyline
        points="12,28 36,38 60,28"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="0.6"
      />
      <polyline
        points="36,38 36,80"
        fill="none"
        stroke="rgba(255,255,255,0.20)"
        strokeWidth="0.5"
      />
      <polyline
        points="16,58 36,38 56,58"
        fill="none"
        stroke="rgba(30,24,18,0.10)"
        strokeWidth="0.5"
      />
      {/* Highlight glow — soft top-left specular. */}
      <ellipse cx="30" cy="24" rx="14" ry="10" fill={`url(#${glowId})`} />
    </svg>
  );
};

export const MoodCrystal = ({ sessions, journalEntries, getBlend, profile }) => {
  const crystal = React.useMemo(
    () => computeMoodCrystal({ sessions, journalEntries, getBlend, profile }),
    [sessions, journalEntries, getBlend, profile],
  );

  // Stable id suffix so multiple crystals on a page don't share
  // the same gradient definition (would cause the second to render
  // with the first's colors in some browsers).
  const idSuffix = React.useId().replace(/[^a-zA-Z0-9]/g, "");

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "12px 14px",
      borderRadius: 12,
      background: theme.cream,
      border: `1px solid ${theme.ruleSoft}`,
      boxShadow: "0 1px 2px rgba(30,24,18,0.04)",
      marginBottom: 14,
    }}>
      <div style={{
        flexShrink: 0,
        // Faint backplate behind the crystal so the shape pops on
        // both the cream light surface and the forest-noir dark
        // surface. Uses the primary color at low alpha — the back
        // glow tints subtly without competing with the shape.
        background: `radial-gradient(ellipse at center, ${crystal.gradient[0]}22 0%, transparent 70%)`,
        borderRadius: "50%",
        padding: 4,
        display: "flex", alignItems: "center", justifyContent: "center",
        // Two-layer glow, each tied to a phrase in the description:
        //   inner aura → secondary current color ("drifting into X")
        //   outer halo → trailing forecast ("with faint X ahead")
        // Either can be missing (null) and the corresponding layer
        // drops cleanly. Always include a faint primary-color
        // ambient at the very inside so the shape pops on the page
        // even when both axis-glows are absent.
        // Hex+alpha pairs: 22 ≈ 13%, 55 ≈ 33%, 60 ≈ 38%.
        boxShadow: [
          `0 0 8px 1px ${crystal.gradient[0]}22`,
          crystal.innerGlowColor && `0 0 16px 3px ${crystal.innerGlowColor}60`,
          crystal.outerGlowColor && `0 0 32px 8px ${crystal.outerGlowColor}55`,
        ].filter(Boolean).join(", "),
        // Faint crystals (profile-only forecast) render dimmer so
        // the visual matches the description's "still gathering"
        // voice — the color is there, just not yet realized.
        opacity: crystal.isFaint ? 0.55 : 1,
        transition: "box-shadow 0.4s ease, opacity 0.3s ease",
      }}>
        <CrystalShape gradient={crystal.gradient} idSuffix={idSuffix} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em",
          textTransform: "uppercase", color: theme.ash, marginBottom: 4,
        }}>
          your crystal
        </div>
        <div style={{
          fontFamily: ff.serif, fontSize: 15, color: theme.ink,
          lineHeight: 1.25, marginBottom: 4,
        }}>
          {crystal.name}
        </div>
        <div style={{
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 12.5,
          color: theme.inkSoft, lineHeight: 1.5,
        }}>
          {crystal.description}
        </div>
      </div>
    </div>
  );
};

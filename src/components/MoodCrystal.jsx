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
import { usePersistedState } from "../hooks/usePersistedState";

// Per-pattern stop configurations for the body fill. Each pattern
// reshapes either the gradient stops or the gradient type so the
// crystal reads visibly differently across the eight pattern words.
// Returned shape: { type: "linear" | "radial", coords, stops }
//   coords:  x1,y1,x2,y2 for linear; cx,cy,r for radial
//   stops:   [{ offset, color, opacity }]
const patternConfig = (pattern, c1, c2) => {
  switch (pattern) {
    case "Swirling":
      // Rotated, alternating stops so the eye reads a curve.
      return {
        type: "linear",
        coords: { x1: "12%", y1: "10%", x2: "88%", y2: "92%" },
        stops: [
          { offset: "0%",   color: c1, opacity: 0.95 },
          { offset: "32%",  color: c2, opacity: 0.92 },
          { offset: "60%",  color: c1, opacity: 0.92 },
          { offset: "100%", color: c2, opacity: 0.88 },
        ],
      };
    case "Misted":
      // Feathered stops — soft, low-contrast, overlapping.
      return {
        type: "linear",
        coords: { x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
        stops: [
          { offset: "0%",   color: c1, opacity: 0.80 },
          { offset: "40%",  color: c2, opacity: 0.70 },
          { offset: "70%",  color: c1, opacity: 0.70 },
          { offset: "100%", color: c2, opacity: 0.78 },
        ],
      };
    case "Banded":
      // Hard 50/50 split so each color reads as its own stripe.
      return {
        type: "linear",
        coords: { x1: "0%", y1: "0%", x2: "0%", y2: "100%" },
        stops: [
          { offset: "0%",   color: c1, opacity: 0.95 },
          { offset: "49%",  color: c1, opacity: 0.95 },
          { offset: "51%",  color: c2, opacity: 0.92 },
          { offset: "100%", color: c2, opacity: 0.92 },
        ],
      };
    case "Blotted":
      // Radial — c1 in the center, c2 toward the edges. Reads as
      // a patch suspended in the stone.
      return {
        type: "radial",
        coords: { cx: "40%", cy: "40%", r: "75%" },
        stops: [
          { offset: "0%",   color: c1, opacity: 0.95 },
          { offset: "55%",  color: c2, opacity: 0.90 },
          { offset: "100%", color: c1, opacity: 0.85 },
        ],
      };
    case "Cloudy":
      // Wide low-contrast radial — blurred suspension, no edge.
      return {
        type: "radial",
        coords: { cx: "50%", cy: "50%", r: "85%" },
        stops: [
          { offset: "0%",   color: c2, opacity: 0.78 },
          { offset: "60%",  color: c1, opacity: 0.85 },
          { offset: "100%", color: c2, opacity: 0.75 },
        ],
      };
    case "Threaded":
    case "Veined":
    case "Dotted":
    default:
      // Default linear — Threaded uses this baseline; Veined and
      // Dotted layer extra geometry on top via the overlay below.
      return {
        type: "linear",
        coords: { x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
        stops: [
          { offset: "0%",   color: c1, opacity: 0.95 },
          { offset: "55%",  color: c2, opacity: 0.92 },
          { offset: "100%", color: c1, opacity: 0.88 },
        ],
      };
  }
};

const CrystalShape = ({ gradient, idSuffix, pattern = "Threaded" }) => {
  const gradId = `crystal-grad-${idSuffix}`;
  const glowId = `crystal-glow-${idSuffix}`;
  const clipId = `crystal-clip-${idSuffix}`;
  const [c1, c2] = gradient;
  const config = patternConfig(pattern, c1, c2);

  // Crystal silhouette polygon — six-faceted bipyramid.
  const silhouette = "36,6 60,28 56,58 36,80 16,58 12,28";

  return (
    <svg width={72} height={84} viewBox="0 0 72 84" aria-hidden>
      <defs>
        {config.type === "linear" ? (
          <linearGradient id={gradId} {...config.coords}>
            {config.stops.map((s, i) => (
              <stop key={i} offset={s.offset} stopColor={s.color} stopOpacity={s.opacity} />
            ))}
          </linearGradient>
        ) : (
          <radialGradient id={gradId} {...config.coords}>
            {config.stops.map((s, i) => (
              <stop key={i} offset={s.offset} stopColor={s.color} stopOpacity={s.opacity} />
            ))}
          </radialGradient>
        )}
        <radialGradient id={glowId} cx="50%" cy="40%" r="60%">
          <stop offset="0%"   stopColor="#fff" stopOpacity="0.55" />
          <stop offset="60%"  stopColor="#fff" stopOpacity="0.0" />
        </radialGradient>
        {/* Clip path for pattern overlays (Veined / Dotted) so the
            extra geometry stays inside the silhouette. */}
        <clipPath id={clipId}>
          <polygon points={silhouette} />
        </clipPath>
      </defs>

      <polygon
        points={silhouette}
        fill={`url(#${gradId})`}
        stroke="rgba(30,24,18,0.18)"
        strokeWidth="0.75"
      />

      {/* Pattern-specific overlay: extra geometry that rides on top
          of the gradient body. Veined draws thin branching currents,
          Dotted scatters small bright points. Both clipped to the
          silhouette so they don't bleed past the cut. */}
      {pattern === "Veined" && (
        <g clipPath={`url(#${clipId})`} stroke={c2} strokeOpacity="0.7" strokeWidth="0.7" fill="none">
          <path d="M22,16 Q34,38 30,72" />
          <path d="M50,18 Q40,40 46,68" />
          <path d="M30,24 Q40,42 38,60" />
        </g>
      )}
      {pattern === "Dotted" && (
        <g clipPath={`url(#${clipId})`} fill={c2} fillOpacity="0.85">
          <circle cx="26" cy="32" r="1.6" />
          <circle cx="44" cy="40" r="1.2" />
          <circle cx="32" cy="50" r="1.4" />
          <circle cx="48" cy="58" r="1.1" />
          <circle cx="22" cy="46" r="1.0" />
          <circle cx="38" cy="66" r="1.3" />
          <circle cx="50" cy="28" r="1.0" />
          <circle cx="30" cy="20" r="0.9" />
        </g>
      )}

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

  // Pulse-on-shift: when the user logs a cup or journal entry the
  // total activity count grows, the crystal pulses once for ~900ms
  // so the change feels reactive instead of silently swapping.
  // Persisted across navigations so the pulse fires on the visit
  // that follows the log, not on every revisit.
  const activityCount = (sessions?.length || 0) + (journalEntries?.length || 0);
  const [lastSeenCount, setLastSeenCount] = usePersistedState("crystalLastSeenCount", 0);
  const [pulsing, setPulsing] = React.useState(false);
  React.useEffect(() => {
    if (activityCount > lastSeenCount) {
      setPulsing(true);
      const t1 = setTimeout(() => setPulsing(false), 900);
      // Acknowledge the new count after the pulse so a second log
      // before the pulse finishes still resets the timer cleanly.
      const t2 = setTimeout(() => setLastSeenCount(activityCount), 950);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [activityCount, lastSeenCount, setLastSeenCount]);

  // Tap to expand — opens a small detail panel below the card
  // showing what's powering the crystal: top families per axis
  // plus the user's onboarding intent for context.
  const [expanded, setExpanded] = React.useState(false);

  // Pulse multiplier — when active, glow alphas roughly double so
  // the crystal flares briefly. The CSS transition on the inner
  // div eases the change in and back.
  const pulseMul = pulsing ? 2 : 1;
  const innerAlpha = pulseMul === 2 ? "B0" : "60";  // 0xB0 ≈ 69%, 0x60 ≈ 38%
  const outerAlpha = pulseMul === 2 ? "A0" : "55";  // 0xA0 ≈ 63%, 0x55 ≈ 33%
  const ambAlpha   = pulseMul === 2 ? "55" : "22";

  return (
    <div style={{
      borderRadius: 12,
      background: theme.cream,
      border: `1px solid ${theme.ruleSoft}`,
      boxShadow: "0 1px 2px rgba(30,24,18,0.04)",
      marginBottom: 14,
      overflow: "hidden",
    }}>
    <button
      type="button"
      onClick={() => setExpanded(v => !v)}
      aria-expanded={expanded}
      style={{
        all: "unset", cursor: "pointer", width: "100%", boxSizing: "border-box",
        display: "flex", alignItems: "center", gap: 14,
        padding: "12px 14px",
      }}
    >
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
        // even when both axis-glows are absent. Pulse boosts every
        // alpha briefly when the user just logged a new entry.
        boxShadow: [
          `0 0 ${pulsing ? 14 : 8}px 1px ${crystal.gradient[0]}${ambAlpha}`,
          crystal.innerGlowColor && `0 0 ${pulsing ? 24 : 16}px 3px ${crystal.innerGlowColor}${innerAlpha}`,
          crystal.outerGlowColor && `0 0 ${pulsing ? 44 : 32}px 8px ${crystal.outerGlowColor}${outerAlpha}`,
        ].filter(Boolean).join(", "),
        // Faint crystals (profile-only forecast) render dimmer so
        // the visual matches the description's "still gathering"
        // voice — the color is there, just not yet realized.
        opacity: crystal.isFaint ? 0.55 : 1,
        transition: "box-shadow 0.4s ease, opacity 0.3s ease",
      }}>
        <CrystalShape gradient={crystal.gradient} idSuffix={idSuffix} pattern={crystal.pattern} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em",
          textTransform: "uppercase", color: theme.ash, marginBottom: 4,
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
        }}>
          <span>your crystal</span>
          <span style={{
            fontSize: 9, color: theme.ash, opacity: 0.7,
            transition: "transform 0.2s ease",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            display: "inline-block",
          }}>▾</span>
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
    </button>
    {expanded && <CrystalDetail crystal={crystal} profile={profile} />}
    </div>
  );
};

// Detail panel under the crystal — shows what's powering the
// current name + description. Family ranks tell the user where
// their activity actually clusters; onboarding intent tells them
// what they said they wanted, so they can see whether they're
// brewing toward it or away from it.
const CrystalDetail = ({ crystal, profile }) => {
  const intentMoods   = (profile?.draw    || []).join(", ");
  const intentFlavors = (profile?.flavors || [])
    .map(e => Array.isArray(e) ? e[0] : e)
    .filter(Boolean)
    .join(", ");
  const effects = (crystal.families?.effect || []).slice(0, 3);
  const flavors = (crystal.families?.flavor || []).slice(0, 3);

  const Row = ({ title, items, empty }) => (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        fontFamily: ff.sans, fontSize: 9, letterSpacing: "0.16em",
        textTransform: "uppercase", color: theme.ash, marginBottom: 4,
      }}>{title}</div>
      {items.length === 0 ? (
        <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 12, color: theme.ash }}>
          {empty}
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {items.map(({ family, weight, color }) => (
            <span key={family} style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "2px 8px", borderRadius: 999,
              background: `${color}1A`,
              border: `1px solid ${color}55`,
              fontFamily: ff.sans, fontSize: 11, color: theme.inkSoft,
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: color, display: "inline-block",
              }} />
              {family} <span style={{ color: theme.ash }}>· {weight}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      padding: "10px 14px 14px",
      borderTop: `1px solid ${theme.ruleSoft}`,
      background: "rgba(var(--hi-rgb),0.04)",
    }}>
      <Row title="from your moods" items={effects} empty="no recent mood data" />
      <Row title="from your cups" items={flavors} empty="no flavor data yet" />
      {(intentMoods || intentFlavors) && (
        <div style={{
          marginTop: 4, paddingTop: 8,
          borderTop: `1px dashed ${theme.ruleSoft}`,
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 12,
          color: theme.inkSoft, lineHeight: 1.5,
        }}>
          You said{" "}
          {intentMoods && <em style={{ fontStyle: "normal", color: theme.terra }}>{intentMoods}</em>}
          {intentMoods && intentFlavors && " and "}
          {intentFlavors && <em style={{ fontStyle: "normal", color: theme.terra }}>{intentFlavors}</em>}
          {" "}draw{(intentMoods.split(",").length + (intentFlavors ? intentFlavors.split(",").length : 0)) === 1 ? "s" : ""} you.
        </div>
      )}
    </div>
  );
};

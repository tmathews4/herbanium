/* ──────────────────────────────────────────────────────────────
   components/MoodCrystal.jsx — the elementals's lead crystal.

   Sits above the Elemental Elementals as a small SVG diamond whose
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
// Stops sit at near-full opacity so the fluorescent palette comes
// through the gradient at maximum saturation — the renderer is now
// going for "this stone glows" rather than "this stone is painted."
const patternConfig = (pattern, c1, c2) => {
  switch (pattern) {
    case "Swirling":
      // Rotated, alternating stops so the eye reads a curve.
      return {
        type: "linear",
        coords: { x1: "12%", y1: "10%", x2: "88%", y2: "92%" },
        stops: [
          { offset: "0%",   color: c1, opacity: 1.00 },
          { offset: "32%",  color: c2, opacity: 0.98 },
          { offset: "60%",  color: c1, opacity: 0.98 },
          { offset: "100%", color: c2, opacity: 0.96 },
        ],
      };
    case "Misted":
      // Feathered stops — soft, low-contrast, overlapping.
      return {
        type: "linear",
        coords: { x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
        stops: [
          { offset: "0%",   color: c1, opacity: 0.92 },
          { offset: "40%",  color: c2, opacity: 0.85 },
          { offset: "70%",  color: c1, opacity: 0.85 },
          { offset: "100%", color: c2, opacity: 0.90 },
        ],
      };
    case "Banded":
      // Diagonal alternation that melds rather than stripes — every
      // color stop is a single peak with no plateau, so the fill
      // continuously slides c1 → c2 → c1 → c2 → c1 across the
      // diagonal. Reads as four bands of light rather than four
      // hard-edged stripes; opacity dips between peaks let the
      // underlying emit/glow bleed through, giving the bands the
      // ethereal aurora register the brief asks for.
      return {
        type: "linear",
        coords: { x1: "10%", y1: "0%", x2: "90%", y2: "100%" },
        stops: [
          { offset: "0%",   color: c1, opacity: 0.94 },
          { offset: "25%",  color: c2, opacity: 0.74 },
          { offset: "50%",  color: c1, opacity: 0.78 },
          { offset: "75%",  color: c2, opacity: 0.74 },
          { offset: "100%", color: c1, opacity: 0.94 },
        ],
      };
    case "Blotted":
      // Radial — c1 in the center, c2 toward the edges. Reads as
      // a patch suspended in the stone.
      return {
        type: "radial",
        coords: { cx: "40%", cy: "40%", r: "75%" },
        stops: [
          { offset: "0%",   color: c1, opacity: 1.00 },
          { offset: "55%",  color: c2, opacity: 0.96 },
          { offset: "100%", color: c1, opacity: 0.92 },
        ],
      };
    case "Cloudy":
      // Wide low-contrast radial — blurred suspension, no edge.
      return {
        type: "radial",
        coords: { cx: "50%", cy: "50%", r: "85%" },
        stops: [
          { offset: "0%",   color: c2, opacity: 0.88 },
          { offset: "60%",  color: c1, opacity: 0.92 },
          { offset: "100%", color: c2, opacity: 0.85 },
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
          { offset: "0%",   color: c1, opacity: 1.00 },
          { offset: "55%",  color: c2, opacity: 0.98 },
          { offset: "100%", color: c1, opacity: 0.95 },
        ],
      };
  }
};

const CrystalShape = ({ gradient, idSuffix, pattern = "Threaded", patternColor, charge = 0 }) => {
  const gradId = `crystal-grad-${idSuffix}`;
  const glowId = `crystal-glow-${idSuffix}`;
  const clipId = `crystal-clip-${idSuffix}`;
  const [c1, c2] = gradient;
  const config = patternConfig(pattern, c1, c2);
  // Pattern overlays (Veined / Dotted) use whichever color sits next
  // to the pattern word in the crystal's name — keeps the dot/vein
  // color tracking the user-readable association ("Onyx and Sage
  // Dotted" → Sage-colored dots) instead of the gradient's c2 slot,
  // which only happens to be the secondary by adjective rank.
  // Falls back to c2 when no patternColor is supplied (legacy shape).
  const overlayColor = patternColor || c2;

  // Crystal silhouette polygon — six-faceted bipyramid.
  const silhouette = "36,6 60,28 56,58 36,80 16,58 12,28";
  // Charge level, drawn as the stone filling from the base up. The
  // silhouette spans y 6..80, so the fill is a full-height rect pushed
  // down by the unfilled remainder and clipped to the shape — a plain
  // translate, which animates reliably everywhere, rather than an
  // animated `y`/`height` (patchier SVG-as-CSS support).
  const CHARGE_TOP = 6, CHARGE_BOTTOM = 80;
  const chargeH = CHARGE_BOTTOM - CHARGE_TOP;
  const level = Math.max(0, Math.min(1, charge));
  const chargeId = `crystal-charge-${idSuffix}`;

  return (
    <svg width={72} height={84} viewBox="0 0 72 84" aria-hidden>
      <defs>
        {/* The travelling highlight. Soft-edged and narrow — a catch of
            light crossing a facet, not a stripe. */}
        <linearGradient data-crystal-layer="sweep" id={`${gradId}-sweep`} x1="0" y1="0" x2="1" y2="0.35">
          <stop offset="0%"   stopColor={theme.cream} stopOpacity="0" />
          <stop offset="45%"  stopColor={theme.cream} stopOpacity="0.30" />
          <stop offset="55%"  stopColor={theme.cream} stopOpacity="0.30" />
          <stop offset="100%" stopColor={theme.cream} stopOpacity="0" />
        </linearGradient>
        {/* Luminance under the waterline — brightest at the surface,
            gone within a few units, so the charge reads as something
            with a top rather than a region that stops. */}
        <linearGradient id={`${gradId}-surface`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={c1} stopOpacity="0.55" />
          <stop offset="100%" stopColor={c1} stopOpacity="0" />
        </linearGradient>
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
          <stop offset="0%"   stopColor="#fff" stopOpacity="0.85" />
          <stop offset="40%"  stopColor="#fff" stopOpacity="0.20" />
          <stop offset="70%"  stopColor="#fff" stopOpacity="0.0" />
        </radialGradient>
        {/* Inner emit — a soft luminous core in the gradient's
            primary color that bleeds outward through the gem,
            making it read as backlit rather than painted. Clipped
            to the silhouette via the clipPath below. */}
        <radialGradient id={`${gradId}-emit`} cx="50%" cy="50%" r="55%">
          <stop offset="0%"   stopColor={c1} stopOpacity="0.55" />
          <stop offset="100%" stopColor={c1} stopOpacity="0.0" />
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
        stroke="rgba(30,24,18,0.12)"
        strokeWidth="0.6"
      />
      {/* Charge level — the stone fills from the base as it charges.
          Drawn as a wash over the UNCHARGED part rather than a tint
          over the charged part. Tinting the filled portion with the
          crystal's own colour just floods it and erases the secondary
          hue: at two-thirds the whole stone read as "greener", not as
          "two-thirds full", and a same-colour surface line was
          invisible. Washing toward the card surface instead leaves the
          charged portion as the true crystal, which is the half the
          user should be looking at, and puts a legible boundary
          between pale and vivid.

          The wash colour is theme.cream — a CSS variable — so it
          lightens on paper and darkens in the forest-noir dark theme
          instead of always washing white.

          Geometry: a full-height rect translated UP as charge rises,
          clipped to the silhouette. Transform animates reliably
          everywhere; animated `y`/`height` on SVG does not. */}
      {level < 1 && (
        // Named, because "the first clipped rect in the svg" stopped
        // being a unique description of the wash the moment the sweep
        // arrived — and two tests were identifying it that way.
        <g data-crystal-layer="charge-wash" clipPath={`url(#${clipId})`}>
          <rect
            x="0" y={CHARGE_TOP} width="72" height={chargeH}
            fill={theme.cream} fillOpacity="0.5"
            style={{
              transform: `translateY(${-level * chargeH}px)`,
              transition: "transform 0.9s cubic-bezier(0.33, 0, 0.2, 1)",
            }}
          />
          {/* Glow beneath the surface. Same transform as the waterline
              so it travels with it, drawn first so the line itself
              stays the crisp edge on top of it. */}
          {level > 0 && (
            <rect
              x="0" y={CHARGE_BOTTOM} width="72" height="9"
              fill={`url(#${gradId}-surface)`}
              style={{
                transform: `translateY(${-level * chargeH}px)`,
                transition: "transform 0.9s cubic-bezier(0.33, 0, 0.2, 1)",
              }}
            />
          )}
          {/* Waterline. Sits at the bottom edge of the wash, in the
              crystal's own primary at full strength — against the
              washed-out region above it, this is the bit that makes
              the level readable at a glance. */}
          {level > 0 && (
            <rect
              x="0" y={CHARGE_BOTTOM - 1} width="72" height="1.2"
              fill={c1} fillOpacity="0.95"
              style={{
                transform: `translateY(${-level * chargeH}px)`,
                transition: "transform 0.9s cubic-bezier(0.33, 0, 0.2, 1)",
              }}
            />
          )}
        </g>
      )}

      {/* The sweep. Clipped to the silhouette so the light stays inside
          the stone, and screened so it brightens what's under it
          instead of painting over it. Sits below the emit overlay —
          the core glow is the crystal's own light and should read as
          deeper than a reflection crossing its face. */}
      <g data-crystal-layer="sweep" clipPath={`url(#${clipId})`}>
        <rect
          className="crystal-sweep"
          x="-30" y="0" width="46" height="84"
          fill={`url(#${gradId}-sweep)`}
        />
      </g>

      {/* Inner emit overlay — adds a luminous core glow on top of
          the gradient body. */}
      <polygon
        points={silhouette}
        fill={`url(#${gradId}-emit)`}
        style={{ mixBlendMode: "screen" }}
      />

      {/* Pattern-specific overlay: extra geometry that rides on top
          of the gradient body. Veined draws thin branching currents,
          Dotted scatters small bright points. Both clipped to the
          silhouette so they don't bleed past the cut. */}
      {pattern === "Veined" && (
        <g clipPath={`url(#${clipId})`} stroke={overlayColor} strokeOpacity="0.7" strokeWidth="0.7" fill="none">
          <path d="M22,16 Q34,38 30,72" />
          <path d="M50,18 Q40,40 46,68" />
          <path d="M30,24 Q40,42 38,60" />
        </g>
      )}
      {pattern === "Dotted" && (
        <g clipPath={`url(#${clipId})`} fill={overlayColor} fillOpacity="0.85">
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

export const MoodCrystal = ({ sessions, journalEntries, getBlend, profile, lockedCrystal, setLockedCrystal, summonReady = false, summonPendingCount = 0, onSummon, charge = 0, tourStep = null }) => {
  // Live crystal — always computed from current activity, even when
  // locked, so we can stash a fresh snapshot into lockedCrystal when
  // the user taps "lock at this state."
  const liveCrystal = React.useMemo(
    () => computeMoodCrystal({ sessions, journalEntries, getBlend, profile }),
    [sessions, journalEntries, getBlend, profile],
  );
  // Displayed crystal — the locked snapshot if one is set, otherwise
  // the live crystal. The shape is the same in both cases so every
  // downstream renderer (gradient, glow halos, name, description,
  // detail panel) works without branching.
  const isLocked = !!lockedCrystal;
  const crystal = isLocked ? lockedCrystal : liveCrystal;

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

  // Crystal shift detection — when the crystal's identity actually
  // changes (different name + different primary color), fire a longer
  // multi-pulse "shift" animation and surface a small banner naming
  // what changed. The activity-count pulse above only signals "you
  // just brewed"; this signals "your crystal moved." We persist a
  // signature of the LAST-SEEN crystal (name + gradient[0]) and
  // compare; mismatch fires the shift mode and stores the previous
  // signature so the banner can read it back ("from X to Y").
  const crystalSig = `${crystal.name}|${crystal.gradient[0]}`;
  const [lastCrystalSig, setLastCrystalSig] = usePersistedState("crystalLastSeenSig", "");
  const [lastCrystalName, setLastCrystalName] = usePersistedState("crystalLastSeenName", "");
  const [shifting, setShifting] = React.useState(false);
  const [shiftFrom, setShiftFrom] = React.useState(null);
  React.useEffect(() => {
    // Don't fire on cold-start (no prior signature stored) — the
    // first ever read of a crystal isn't a "shift," it's an arrival.
    if (!lastCrystalSig) {
      setLastCrystalSig(crystalSig);
      setLastCrystalName(crystal.name);
      return;
    }
    // While locked, the crystal isn't actually shifting from the
    // user's perspective — they pinned it. Skip the flare so the
    // band doesn't spuriously fire on every visit while locked.
    if (isLocked) return;
    if (lastCrystalSig !== crystalSig) {
      setShifting(true);
      // Coerce shiftFrom to a real, trimmed string. If lastCrystalName
      // is undefined / object / empty, fall back to null and the
      // banner suppresses itself (the && shiftFrom guard below) rather
      // than rendering a broken substitution.
      const safePrev = (typeof lastCrystalName === "string" && lastCrystalName.trim())
        ? lastCrystalName.trim()
        : null;
      setShiftFrom(safePrev);
      // 9s gives a comfortable read window for the full sentence —
      // 5.5s was still passing too quickly. The banner keyframe fades
      // in fast, holds, then fades out over the last beat. Pulse-mul-3
      // glow flare runs the whole time. The from-name clears another
      // moment after the timeout so a re-render doesn't re-display
      // a stale value.
      const t = setTimeout(() => {
        setShifting(false);
        setLastCrystalSig(crystalSig);
        setLastCrystalName(crystal.name);
        setTimeout(() => setShiftFrom(null), 1200);
      }, 9000);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crystalSig]);

  // Tap to expand — opens a small detail panel below the card
  // showing what's powering the crystal: top families per axis
  // plus the user's onboarding intent for context.
  const [expanded, setExpanded] = React.useState(false);
  // The tour's lock step has to point at a control that only exists
  // inside the expanded panel, and the tour overlay swallows taps — so
  // the step opens the panel itself rather than asking the user to.
  // Reverts to whatever they had when the step passes.
  const tourWantsPanel = tourStep === "lodestone-lock";
  const isExpanded = expanded || tourWantsPanel;

  // Pulse multiplier — shifting >> activity pulse > resting. Shift
  // is a stronger flare so the crystal-identity-change reads as a
  // bigger event than just "you brewed something."
  const pulseMul = shifting ? 3 : (pulsing ? 2 : 1);
  // Halo alphas lifted hard for the fluorescent palette — the
  // crystal now reads as actively emitting light, not just tinted.
  // Resting state still distinguishable from the pulse state.
  const innerAlpha = pulseMul === 3 ? "F0" : pulseMul === 2 ? "D0" : "85";  // 0xF0 ≈ 94%, D0 ≈ 82%, 85 ≈ 52%
  const outerAlpha = pulseMul === 3 ? "E0" : pulseMul === 2 ? "C0" : "78";  // 0xE0 ≈ 88%, C0 ≈ 75%, 78 ≈ 47%
  const ambAlpha   = pulseMul === 3 ? "90" : pulseMul === 2 ? "70" : "3A";  // 0x90 ≈ 56%, 70 ≈ 44%, 3A ≈ 23%

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
      aria-expanded={isExpanded}
      style={{
        all: "unset", cursor: "pointer", width: "100%", boxSizing: "border-box",
        display: "flex", alignItems: "center", gap: 14,
        padding: "12px 14px",
        position: "relative",
      }}
    >
      <div
        onClick={summonReady ? (e) => { e.stopPropagation(); if (onSummon) onSummon(); } : undefined}
        role={summonReady ? "button" : undefined}
        title={summonReady ? "tap the lodestone to observe what's pulsing" : undefined}
        style={{
          flexShrink: 0,
          position: "relative",
          // Faint backplate behind the crystal so the shape pops on
          // both the cream light surface and the forest-noir dark
          // surface. Uses the primary color at low alpha — the back
          // glow tints subtly without competing with the shape.
          background: `radial-gradient(ellipse at center, ${crystal.gradient[0]}22 0%, transparent 70%)`,
          borderRadius: "50%",
          padding: 4,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: summonReady ? "pointer" : "default",
          // Two-layer glow, each tied to a phrase in the description.
          // When a summon is ready (pendingArrivals waiting), a
          // separate keyframe animation overlays a rhythmic ring
          // expansion in terra so the lodestone reads as actively
          // calling — distinct from the resting glow + activity
          // pulse + identity-shift flare.
          boxShadow: [
            `0 0 ${pulsing ? 18 : 12}px 2px ${crystal.gradient[0]}${ambAlpha}`,
            crystal.innerGlowColor && `0 0 ${pulsing ? 28 : 20}px 4px ${crystal.innerGlowColor}${innerAlpha}`,
            crystal.outerGlowColor && `0 0 ${pulsing ? 50 : 38}px 10px ${crystal.outerGlowColor}${outerAlpha}`,
          ].filter(Boolean).join(", "),
          opacity: crystal.isFaint ? 0.55 : 1,
          transition: "box-shadow 0.4s ease, opacity 0.3s ease",
          animation: summonReady ? "lodestoneSummonPulse 2.0s ease-in-out infinite" : undefined,
        }}>
        {/* Continuous aura — a rhythmic breathing layer underneath
            the crystal that pulses opacity 0.45 → 1.0 → 0.45 across
            a slow 3.6s cycle. Sits behind the CrystalShape so it
            adds a soft halo without competing with the state-driven
            shadow ladder above (resting / activity pulse / shift
            flare / summon-ready scale). The box-shadow uses the
            primary gradient color at moderate alpha; opacity
            keyframe handles the breathing. */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: 4,
            borderRadius: "50%",
            boxShadow: `0 0 22px 6px ${crystal.gradient[0]}66`,
            opacity: crystal.isFaint ? 0.3 : 0.65,
            pointerEvents: "none",
            animation: "lodestoneAuraBreath 3.6s ease-in-out infinite",
          }}
        />
        <CrystalShape gradient={crystal.gradient} idSuffix={idSuffix} pattern={crystal.pattern} patternColor={crystal.patternColor} charge={charge} />
        {/* Pending-arrivals badge — small terra dot with count,
            anchored at the top-right of the crystal halo. Visibility
            is decoupled from summonReady so the badge persists
            behind an open arrival card and updates down as the user
            views each visitor: the parent passes a count that
            already excludes the one currently being observed, so
            tapping with 3 waiting flips the badge to 2 immediately
            and so on. Hidden once the count hits zero. */}
        {summonPendingCount > 0 && (
          <span style={{
            position: "absolute",
            top: 0, right: 0,
            minWidth: 18, height: 18, padding: "0 5px",
            borderRadius: 999,
            background: theme.terra, color: theme.cream,
            fontFamily: ff.sans, fontSize: 10, fontWeight: 700,
            letterSpacing: "0.02em",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 0 2px " + theme.cream,
            transition: "opacity 0.18s ease",
          }}>{summonPendingCount}</span>
        )}
      </div>
      <div style={{
        flex: 1, minWidth: 0,
        // Reserve room at the bottom of the text column for the
        // absolutely-positioned 'details' pill. Bumped to 38 (was
        // 26) so wrapped descriptions get a clear gap before the
        // pill — at 26 the last line of italic copy could still
        // crowd the pill's edge.
        paddingBottom: 38,
      }}>
        <div style={{
          fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em",
          textTransform: "uppercase", color: theme.ash, marginBottom: 4,
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
          gap: 6,
        }}>
          <span style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }}>
            <span>your lodestone</span>
            {isLocked && (
              <span style={{
                fontFamily: ff.sans, fontSize: 8.5, letterSpacing: "0.14em",
                color: crystal.gradient[0], opacity: 0.85,
              }} title="locked at a pinned snapshot">· locked</span>
            )}
          </span>
          {/* Top-right chevron retired in favor of the more visible
              bottom-right affordance below — keeps the eyebrow row
              clean and makes the expand intent more discoverable. */}
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
      {/* Bottom-right expand affordance — a small terra-tinted pill
          with a caret that nudges the eye toward the breakdown
          panel. Rotates 180° when expanded so the same affordance
          reads as "tap to collapse" without re-anchoring the user
          to a different control. The pill pulses gently when
          collapsed (faint terra glow) so it reads as an invitation,
          not just decoration; pulse stops when expanded since the
          panel below is the visible answer to the invitation. */}
      <span
        aria-hidden
        data-tour="lodestone-details"
        style={{
          position: "absolute",
          right: 10, bottom: 10,
          display: "inline-flex", alignItems: "center", gap: 3,
          padding: "2px 7px",
          borderRadius: 999,
          background: isExpanded ? "rgba(176,84,47,0.10)" : `${crystal.gradient[0]}14`,
          border: `1px solid ${isExpanded ? theme.terra : crystal.gradient[0]}55`,
          fontFamily: ff.sans, fontSize: 8, letterSpacing: "0.14em",
          textTransform: "uppercase", color: theme.terra,
          fontWeight: 600, lineHeight: 1,
          animation: isExpanded ? "none" : "crystalExpandPulse 2.4s ease-in-out infinite",
          transition: "background 0.18s ease, border-color 0.18s ease",
        }}
      >
        <span>{isExpanded ? "less" : "details"}</span>
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none"
             style={{
               transition: "transform 0.22s ease",
               transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
             }}>
          <path d="M1.5 3 L4.5 6 L7.5 3" stroke={theme.terra}
                strokeWidth="1.5" strokeLinecap="round"
                strokeLinejoin="round" fill="none" />
        </svg>
      </span>
    </button>
    {/* Crystal-shift banner — surfaces the moment a user lands on
        the elementals AFTER the crystal has changed identity (different
        name + different primary color than last seen). The 2.4s
        animation flare above is the visual cue; this is the textual
        cue that names what shifted. Fades out a beat after the flare
        ends so the page settles back to the resting view. */}
    {shifting && shiftFrom && (
      <div style={{
        margin: "0 14px 12px",
        padding: "8px 10px 8px 12px",
        borderLeft: `2px solid ${crystal.gradient[0]}`,
        background: `${crystal.gradient[0]}11`,
        borderRadius: "0 6px 6px 0",
        fontFamily: ff.serif, fontSize: 12.5,
        color: theme.ink, lineHeight: 1.45,
        animation: "crystalShiftFade 9s ease",
      }}>
        <span style={{
          fontFamily: ff.sans, fontSize: 9, letterSpacing: "0.16em",
          textTransform: "uppercase", color: crystal.gradient[0],
          marginRight: 8, fontWeight: 600,
        }}>your crystal shifted</span>
        {/* shiftFrom and crystal.name are coerced to safe strings —
            shiftFrom by the safePrev guard above (banner suppresses
            entirely if non-string), crystal.name by computeMoodCrystal
            which always returns a fully-substituted name string. */}
        from <em style={{ color: theme.inkSoft }}>{String(shiftFrom)}</em> to <em style={{ color: theme.ink }}>{String(crystal.name || "")}</em> — the last few cups changed which way it points.
      </div>
    )}
    <style>{`
      @keyframes crystalShiftFade {
        0%   { opacity: 0; transform: translateY(-4px); }
        4%   { opacity: 1; transform: translateY(0); }
        94%  { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(0); }
      }
      @keyframes crystalExpandPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(176,84,47,0.0); }
        50%      { box-shadow: 0 0 0 3px rgba(176,84,47,0.16); }
      }
      /* Summon-ready pulse — overlays a rhythmic terra ring on the
         lodestone's halo to indicate visitors waiting to be observed.
         Distinct from the activity pulse + identity-shift flare so
         users can read "something to summon" at a glance. */
      @keyframes lodestoneSummonPulse {
        0%, 100% { transform: scale(1); }
        50%      { transform: scale(1.06); }
      }
      /* Continuous aura breath — slow 3.6s opacity pulse on the
         halo layer behind the crystal so the lodestone reads as
         alive at all times rather than only flaring on events.
         Subtle enough to read as "the stone is humming" rather
         than asking for attention. */
      @keyframes lodestoneAuraBreath {
        0%, 100% { opacity: 0.40; }
        50%      { opacity: 1.00; }
      }
    `}</style>
    {isExpanded && (
      <CrystalDetail
        crystal={crystal}
        profile={profile}
        isLocked={isLocked}
        liveCrystal={liveCrystal}
        onToggleLock={() => {
          if (!setLockedCrystal) return;
          if (isLocked) setLockedCrystal(null);
          else setLockedCrystal(liveCrystal);
        }}
      />
    )}
    </div>
  );
};

// Detail panel under the crystal — shows what's powering the
// current name + description. Family ranks tell the user where
// their activity actually clusters; onboarding intent tells them
// what they said they wanted, so they can see whether they're
// brewing toward it or away from it.
const CrystalDetail = ({ crystal, profile, isLocked, liveCrystal, onToggleLock }) => {
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
      {/* Lock toggle — pin the crystal at its current mood/flavor
          profile so it stops drifting as recent activity changes,
          or unlock to let it track live again. The button copy
          flips with state so the action and its effect read cleanly.
          Tap propagation is stopped so the surrounding header
          collapse doesn't fire when this button is tapped. */}
      {onToggleLock && (() => {
        // Has the live crystal drifted away from the locked snapshot?
        // If so, surface a small preview row of where it would
        // settle on unlock — name + the gradient color as a small
        // dot — so the user can decide without having to unlock
        // and see what happens. Comparison is name-based since the
        // name is the user-visible identity; identical names mean a
        // de-facto no-op even if internals shifted slightly.
        const driftedTo = (isLocked
          && liveCrystal
          && typeof liveCrystal.name === "string"
          && liveCrystal.name !== crystal.name)
          ? liveCrystal
          : null;
        return (
        <div data-tour="lodestone-lock" style={{
          marginTop: 10, paddingTop: 10,
          borderTop: `1px dashed ${theme.ruleSoft}`,
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 12,
          }}>
            <div style={{
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 12,
              color: theme.inkSoft, lineHeight: 1.4, flex: 1, minWidth: 0,
            }}>
              {isLocked
                ? "pinned at this profile — the crystal won't drift while locked."
                : "lock to pin this profile so the crystal holds steady, even if your brewing patterns shift."}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
              style={{
                flexShrink: 0,
                fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.12em",
                textTransform: "uppercase", fontWeight: 600,
                padding: "6px 12px", borderRadius: 999,
                border: `1px solid ${isLocked ? theme.terra : theme.ruleSoft}`,
                background: isLocked ? theme.terra : "transparent",
                color: isLocked ? theme.cream : theme.inkSoft,
                cursor: "pointer",
                transition: "background 0.18s ease, color 0.18s ease, border-color 0.18s ease",
              }}
            >
              {isLocked ? "unlock" : "lock"}
            </button>
          </div>
          {driftedTo && (
            <div style={{
              fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.04em",
              color: theme.ash, lineHeight: 1.5,
              display: "flex", alignItems: "center", gap: 6,
              flexWrap: "wrap",
            }}>
              <span style={{
                fontFamily: ff.sans, fontSize: 9, letterSpacing: "0.16em",
                textTransform: "uppercase", color: theme.ash,
              }}>on unlock →</span>
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: driftedTo.gradient && driftedTo.gradient[0],
                display: "inline-block", flexShrink: 0,
                boxShadow: driftedTo.gradient && driftedTo.gradient[0]
                  ? `0 0 6px ${driftedTo.gradient[0]}80`
                  : "none",
              }} />
              <span style={{
                fontFamily: ff.serif, fontSize: 12, color: theme.ink,
                fontStyle: "italic",
              }}>{driftedTo.name}</span>
            </div>
          )}
        </div>
        );
      })()}
    </div>
  );
};

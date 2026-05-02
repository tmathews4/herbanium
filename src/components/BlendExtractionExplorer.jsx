/* ──────────────────────────────────────────────────────────────
   components/BlendExtractionExplorer.jsx — interactive blend-level
   temp/time explorer for BlendDetail and Compose summary.

   This is where the blending algorithm becomes visible to the user.
   For a blend of multiple ingredients, the sliders expose:
   - What happens to effects as you change brew conditions
   - Which ingredients "agree" vs "stretch" at each temperature
   - That brewing involves real trade-offs, not magic single recipes

   Architecture:
   - Temp slider spans the UNION of constituent ingredients' tempC
     ranges (most honest; shows what's possible, even if compromised)
   - Time slider spans the union of timeS ranges similarly
   - Per-ingredient "in-range" dot indicator shows which ingredients
     are being brewed inside their preferred zone at current setting
   - Effect bars recompute live via resolveBlendAtBrew()

   This component is intentionally shared between BlendDetail and
   Compose. The props tell it what to render; the behavior is the
   same in both contexts.

   Shared with single-ingredient ExtractionExplorer: the slider
   styling. Different: the data path (blend-level vs ingredient-level)
   and the per-ingredient range indicator.
   ────────────────────────────────────────────────────────────── */

import React, { useState, useMemo, useEffect } from "react";
import { theme, ff } from "../theme";
import { useUnit, cToF, gramsToTsp, formatTsp } from "../units/units";
import { resolveBlendAtBrew, computeBrewProfile, TRADITION_TIME_TOLERANCE_S } from "../algo/compose";
import { unionAndPadTempRange, unionAndPadTimeRange } from "../algo/brewBounds";
import { INGREDIENTS } from "../data/ingredients";
import { FlavorMap, MoodMap, PalateMap } from "./FlavorMap";

// Caffeine load thresholds (mg). Tuned so the bar's "too much"
// tick lines up with where the perception.js high-caffeine warning
// path fires on a real morning cup — masala chai at recommended
// brew lands at ~120mg and that should already read as "pushing
// it" on the bar, not sit quietly mid-track. Caution begins at
// 60mg (the warning's bare trigger when stacked with strong
// energy/focus); too-much at 120mg (a strong single cup); the
// 250mg ceiling holds for stacked caffeine-bearing leaves.
const CAFFEINE_MAX_MG = 250;
const CAFFEINE_CAUTION_MG = 60;
const CAFFEINE_WARN_MG = 120;

// Single-row caffeine load gauge — sits in the Balance section
// alongside the bitter/astringent palate axes. Reads as a fixed
// 0-250mg track with two threshold ticks (caution / warning) and
// a terra fill that intensifies past warning. Shares the palate
// strip's visual register so users learn one bar shape applies
// across all "is this cup pushing too hard?" signals.
const CaffeineBar = ({ caffeineMg = 0, totalG = 0, totalTsp = 0, weightUnit = "g" }) => {
  const mg = Math.max(0, Math.round(caffeineMg));
  const grams = Math.max(0, Number(totalG) || 0);
  const tsp = Math.max(0, Number(totalTsp) || 0);
  // Respect the user's weight-unit preference rather than always
  // showing grams. Grams: round to half-gram for a tidy hint.
  // Teaspoons: hand off to formatTsp so the rendering matches the
  // rest of the app's tsp/tbsp/pinch ladder. Suppress when the
  // caller hasn't wired the total through.
  const gramsLabel = grams > 0
    ? (weightUnit === "g"
        ? `${(Math.round(grams * 2) / 2).toFixed(1)} g leaf`
        : `${formatTsp(tsp)} leaf`)
    : null;
  const pct = Math.min(100, (mg / CAFFEINE_MAX_MG) * 100);
  // Three-tier read at the warning line: exactly AT the threshold
  // is "right on the edge" — softer rose tone, no ⚠, small note —
  // while >threshold flips to the full terra+⚠ warning. Lets a cup
  // that lands at the limit feel like a deliberate choice rather
  // than a violation, and reserves the alarm for actual overshoot.
  const past = mg > CAFFEINE_WARN_MG;
  const atEdge = mg === CAFFEINE_WARN_MG;
  const inCaution = mg >= CAFFEINE_CAUTION_MG && !past && !atEdge;
  const fillColor = past
    ? "#B0542F"
    : (atEdge ? "#A57836" : (inCaution ? "#C37959" : "rgba(176,84,47,0.55)"));
  const labelColor = past ? "#B0542F" : (atEdge ? "#A57836" : theme.inkSoft);
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 6,
      paddingTop: 4,
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
      }}>
        <div style={{
          display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap",
        }}>
          <div style={{
            fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.16em",
            textTransform: "uppercase", color: theme.ash,
          }}>caffeine load</div>
          {gramsLabel && (
            <div style={{
              fontFamily: ff.mono, fontSize: 9.5, color: theme.ash,
            }}>· {gramsLabel} · 250 ml cup</div>
          )}
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          fontFamily: ff.mono, fontSize: 11, color: labelColor,
        }}>
          {past && <span style={{ color: "#B0542F" }}>⚠</span>}
          <span>{mg} mg</span>
        </div>
      </div>
      <div style={{
        position: "relative", height: 10, borderRadius: 999,
        background: "rgba(var(--hi-rgb), 0.06)",
        border: `1px solid ${theme.ruleSoft}`,
        overflow: "hidden",
      }}>
        {/* Filled portion */}
        <div style={{
          position: "absolute", inset: 0,
          width: `${pct}%`,
          background: `linear-gradient(90deg, rgba(176,84,47,0.35) 0%, ${fillColor} 100%)`,
          transition: "width 0.18s ease, background 0.18s ease",
        }} />
        {/* Caution tick (~80mg) */}
        <div style={{
          position: "absolute", top: 0, bottom: 0,
          left: `${(CAFFEINE_CAUTION_MG / CAFFEINE_MAX_MG) * 100}%`,
          width: 1, background: "rgba(176,84,47,0.30)",
        }} />
        {/* Warning tick (~150mg) */}
        <div style={{
          position: "absolute", top: 0, bottom: 0,
          left: `${(CAFFEINE_WARN_MG / CAFFEINE_MAX_MG) * 100}%`,
          width: 1, background: "rgba(176,84,47,0.65)",
        }} />
      </div>
      <div style={{
        position: "relative", height: 11,
        fontFamily: ff.mono, fontSize: 8.5, color: theme.ash,
        letterSpacing: "0.08em",
      }}>
        <span style={{ position: "absolute", left: 0 }}>0</span>
        <span style={{
          position: "absolute",
          left: `${(CAFFEINE_CAUTION_MG / CAFFEINE_MAX_MG) * 100}%`,
          transform: "translateX(-50%)",
        }}>caution</span>
        <span style={{
          position: "absolute",
          left: `${(CAFFEINE_WARN_MG / CAFFEINE_MAX_MG) * 100}%`,
          transform: "translateX(-50%)",
          color: past ? "#B0542F" : (atEdge ? "#A57836" : theme.ash),
        }}>too much</span>
        <span style={{ position: "absolute", right: 0 }}>{CAFFEINE_MAX_MG}mg</span>
      </div>
      {atEdge && (
        <div style={{
          fontFamily: ff.serif, fontSize: 12.5,
          color: "#A57836", lineHeight: 1.4, marginTop: 2,
        }}>
          right at the edge — a deliberate strong cup, but one more part and it tips over.
        </div>
      )}
    </div>
  );
};

// Slider bounds — union of every ingredient's range, padded with
// experimentation room. Single source of truth in algo/brewBounds.

/**
 * Blend-level temp/time explorer with live effect recomputation.
 *
 * Supports two modes:
 *   - Uncontrolled (default, used by BlendDetail): manages its own
 *     tempC/timeS state internally.
 *   - Controlled (used by ComposeScreen): parent passes tempC/setTempC
 *     and timeS/setTimeS, so the parent can read live values for
 *     reactive warnings above the explorer.
 *
 * Ingredient prop is reactive — if it changes (e.g. user picks a
 * different suggestion), the slider ranges recompute via useMemo,
 * and a safety useEffect clamps any current values into the new range.
 */
export const BlendExtractionExplorer = ({
  ingredients,              // [{id, g}, ...]
  hideTraditionNote = false,  // suppress the inline note (caller renders elsewhere)
  onTraditionNoteChange,    // optional callback fired with the note payload
  defaultTempC,             // from computeBrewProfile (algorithm's recommendation)
  defaultTimeS,             // from computeBrewProfile
  tempC: tempCProp,         // optional controlled
  setTempC: setTempCProp,   // optional controlled
  timeS: timeSProp,         // optional controlled
  setTimeS: setTimeSProp,   // optional controlled
  compact = false,          // smaller layout for Compose context
  curated = false,          // curator-chosen recipe — suppresses outsider
                            // warnings when sitting on the curator's defaults
  experimental = false,     // user-built blend — every warning fires
                            // immediately, no baseline-at-rest suppression.
                            // The user is exploring; spell out what's wrong.
  isHouse = false,          // Herbanium house signature — a research-
                            // driven recipe tuned with deliberate stretch.
                            // Used alongside isTraditional to soften the
                            // warning band's tone: warnings are reframed
                            // as character notes the recipe expects.
  isTraditional = false,    // genuine cultural tradition (chai, sencha…).
                            // Required for the tradition-over-literature
                            // notice to fire; experimentals and synths
                            // shouldn't claim that lineage.
  declaredEffects = null,   // blend.effects — soft-floor for cup-level
                            // mood resolution. Without it, a curator's
                            // declared "uplifting" register can fall
                            // out of moodSummary if the perception
                            // pipeline doesn't surface it on its own.
}) => {
  const { unit, weightUnit } = useUnit();

  // Shared Simple/Detailed mode for the flavor + mood strips. One
  // toggle at the top of the explorer drives both at once so the
  // user picks a register (rolled-up families vs specific notes /
  // leaf effects) for the whole panorama, not per-strip.
  const [familyMode, setFamilyMode] = useState(true);

  // Range-band selection. Each axis ("tempC" / "timeS") gets its
  // own slot — tapping a band toggles a description panel below
  // that slider. null means "nothing selected for this axis."
  const [bandSelected, setBandSelected] = useState({ tempC: null, timeS: null });
  const selectBand = (axis, kind) =>
    setBandSelected(prev => ({ ...prev, [axis]: kind }));

  const tempCRange = useMemo(() => unionAndPadTempRange(ingredients, INGREDIENTS), [ingredients]);
  const timeSRange = useMemo(() => unionAndPadTimeRange(ingredients, INGREDIENTS), [ingredients]);

  // Master union of every flavor and effect that any constituent
  // ingredient can ever produce — pulls from EXTRACTION_PROFILES first,
  // and falls back to INGREDIENTS[id].flavors / .effects for ingredients
  // Internal state — only used when parent hasn't supplied controlled values.
  const [tempCInternal, setTempCInternal] = useState(() =>
    defaultTempC ?? Math.round((tempCRange[0] + tempCRange[1]) / 2)
  );
  const [timeSInternal, setTimeSInternal] = useState(() =>
    defaultTimeS ?? Math.round((timeSRange[0] + timeSRange[1]) / 2)
  );

  const isControlled = tempCProp !== undefined && setTempCProp !== undefined;
  const tempC = isControlled ? tempCProp : tempCInternal;
  const setTempC = isControlled ? setTempCProp : setTempCInternal;
  const timeS = (timeSProp !== undefined && setTimeSProp) ? timeSProp : timeSInternal;
  const setTimeS = (timeSProp !== undefined && setTimeSProp) ? setTimeSProp : setTimeSInternal;

  // Safety: if ingredients change and the slider values are now out of
  // range, clamp them. Runs in BOTH controlled and uncontrolled mode —
  // the parent (ComposeScreen) provides setTempC/setTimeS in controlled
  // mode, so calling them here propagates the clamp upward. Without
  // this, a parent-held value that's out of the new range pinned the
  // slider's thumb to the boundary — onChange would update state for
  // a moment, then the next render's controlled prop snapped the
  // value back, leaving the slider feeling unresponsive.
  useEffect(() => {
    const clampedTemp = Math.min(tempCRange[1], Math.max(tempCRange[0], tempC));
    if (clampedTemp !== tempC) setTempC(clampedTemp);
    const clampedTime = Math.min(timeSRange[1], Math.max(timeSRange[0], timeS));
    if (clampedTime !== timeS) setTimeS(clampedTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempCRange, timeSRange]);

  // Live blend computation at current slider values. The default tempC/timeS
  // act as the baseline — per-ingredient over-pull warnings only fire when
  // the user has pushed past them. For curated blends, outsider warnings
  // are also silenced when the user sits exactly on the baseline.
  // Experimental (user-built) blends skip baseline entirely so every
  // warning fires immediately.
  const brew = experimental
    ? resolveBlendAtBrew(ingredients, tempC, timeS, undefined, undefined, false, false, declaredEffects)
    : resolveBlendAtBrew(ingredients, tempC, timeS, defaultTempC, defaultTimeS, curated, isTraditional, declaredEffects);

  // Algorithm-derived "research-aligned" brew — the temperature-range
  // intersection (or grams-weighted compromise) plus weighted time.
  // Restricts to lead-role ingredients so accents and catalysts (which
  // the curator deliberately stretched) don't drag the recommendation
  // toward a Western-steep compromise that nobody actually drinks.
  const sciBrew = useMemo(
    () => computeBrewProfile(ingredients, { leadOnly: true }),
    [ingredients],
  );
  // Show the recommendation only when it points somewhere meaningfully
  // different — temp delta or > 90s time delta. A 30-second steep
  // adjustment isn't a "research-aligned alternative" worth surfacing.
  const sciDiffers = sciBrew.tempC !== defaultTempC
    || Math.abs(sciBrew.timeS - defaultTimeS) > TRADITION_TIME_TOLERANCE_S;
  const sciTempDisplay = unit === "F" ? `${cToF(sciBrew.tempC)}°F` : `${sciBrew.tempC}°C`;
  const sciTimeDisplay = `${Math.floor(sciBrew.timeS / 60)}:${String(sciBrew.timeS % 60).padStart(2, "0")}`;

  // Display formatting
  const displayTemp = unit === "F" ? `${cToF(tempC)}°F` : `${tempC}°C`;
  const displayTime = `${Math.floor(timeS / 60)}:${String(timeS % 60).padStart(2, "0")}`;
  const tempMinDisplay = unit === "F" ? cToF(tempCRange[0]) : tempCRange[0];
  const tempMaxDisplay = unit === "F" ? cToF(tempCRange[1]) : tempCRange[1];

  const compatible = brew.outsiders.length === 0;

  // When a parent caller wants to render the tradition note in
  // its own slot (BlendDetail places it above the preparations
  // dropdown), notify it whenever the note's payload changes.
  // The render here is also suppressed via hideTraditionNote.
  useEffect(() => {
    if (!onTraditionNoteChange) return;
    if (brew.traditionNote) {
      onTraditionNoteChange({
        sciDiffers,
        sciTempDisplay,
        sciTimeDisplay,
      });
    } else {
      onTraditionNoteChange(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brew.traditionNote, sciDiffers, sciTempDisplay, sciTimeDisplay]);

  return (
    <div style={{
      padding: compact ? "14px 14px 16px" : "16px 16px 18px",
      borderRadius: 12,
      background: theme.cream,
      border: `1px solid ${theme.ruleSoft}`,
    }}>

      {/* Flavor + mood + palate across the temperature envelope.
          Sits ABOVE the temp/steep sliders now: the maps are fixed-
          height (per-track normalization keeps each band's intensity
          constant as the slider moves — only the vertical indicator
          travels), so they no longer expand mid-drag and shove the
          sliders downward. Reading order is now panorama → controls,
          which matches the way a user thinks about brewing: see the
          whole envelope, then aim for a point in it.

          A single Simple/Detailed segmented toggle at the top drives
          BOTH the flavor and mood strips at once — registers vs
          specific notes/leaf effects. Palate doesn't have a
          comparable hierarchy and reads the same in either mode. */}
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{
          display: "flex", justifyContent: "flex-end", alignItems: "center",
        }}>
          <span style={{
            display: "inline-flex",
            border: `1px solid ${theme.ruleSoft}`,
            borderRadius: 999,
            overflow: "hidden",
          }}>
            {[
              { id: "simple",   label: "Simple"   },
              { id: "detailed", label: "Detailed" },
            ].map(opt => {
              const active = (opt.id === "simple") === familyMode;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    const want = opt.id === "simple";
                    if (want === familyMode) return;
                    setFamilyMode(want);
                  }}
                  style={{
                    fontFamily: ff.sans, fontSize: 9.5,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    padding: "3px 9px",
                    background: active ? theme.terra : "transparent",
                    color: active ? theme.cream : theme.ash,
                    border: "none",
                    cursor: active ? "default" : "pointer",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </span>
        </div>
        <FlavorMap
          ingredients={ingredients}
          tempC={tempC}
          timeS={timeS}
          tempCRange={tempCRange}
          showAxis={false}
          familyMode={familyMode}
        />
        <MoodMap
          ingredients={ingredients}
          tempC={tempC}
          timeS={timeS}
          tempCRange={tempCRange}
          showAxis={false}
          familyMode={familyMode}
        />
        <PalateMap
          ingredients={ingredients}
          tempC={tempC}
          timeS={timeS}
          tempCRange={tempCRange}
          curated={curated}
          isTraditional={isTraditional}
          defaultTempC={defaultTempC}
          defaultTimeS={defaultTimeS}
        />
        {/* Caffeine load — sits inside the Balance section under the
            palate strip so the user reads bitter/astringent/caffeine
            as one "is the cup pushing too hard?" group. The number
            doesn't shift meaningfully across temp/time (caffeine is
            largely temp-flat for the user's purposes), so it renders
            as a static gauge rather than a per-temperature band. */}
        {brew?.caffeineMg != null && brew.caffeineMg > 0 && (
          <CaffeineBar
            caffeineMg={brew.caffeineMg}
            totalG={(ingredients || []).reduce((s, it) => s + (Number(it?.g) || 0), 0)}
            // Tsp totals are category-aware: each ingredient
            // converts at its own density (true tea ≈ 2 g/tsp, spice
            // ≈ 2.5, herbal ≈ 1.2…) so the cup's total reflects the
            // actual scoop count, not a flat divisor.
            totalTsp={(ingredients || []).reduce((s, it) => {
              const meta = INGREDIENTS[it?.id];
              if (!meta) return s;
              return s + gramsToTsp(Number(it?.g) || 0, meta.category);
            }, 0)}
            weightUnit={weightUnit}
          />
        )}
      </div>

      {/* Range bands — three states:
          1. Full intersection (every non-catalyst in range): GREEN.
             The blend's natural sweet spot.
          2. No full intersection but the primary lead overlaps with
             at least one other ingredient: YELLOW. The compromise
             zone — primary plus as many others as overlap with it
             at peak coverage. Honest signal that the blend can't
             satisfy every ingredient but here's where it's least
             stretched.
          3. Primary lead's window doesn't overlap with any other
             ingredient at all: no band. Nothing useful to show.
          Catalysts always skip — trace dose carries no signal. */}
      {(() => {
        const bandData = ingredients
          .map(({ id, role, g }) => {
            const meta = INGREDIENTS[id];
            if (!meta) return null;
            if (role === "catalyst") return null;
            return {
              id,
              name: meta.name,
              role: role || "lead",
              g: g || 0,
              tempC: meta.tempC,
              timeS: meta.timeS,
            };
          })
          .filter(Boolean);

        // Pick the heaviest lead as the primary anchor for the
        // yellow-fallback. If no explicit leads, fall back to the
        // heaviest non-catalyst.
        const leads = bandData.filter(b => b.role === "lead");
        const primary = (leads.length > 0 ? leads : bandData)
          .slice()
          .sort((a, b) => b.g - a.g)[0];

        // Full intersection across all non-catalyst windows.
        const intersect = (axis) => {
          let lo = -Infinity, hi = Infinity;
          for (const ing of bandData) {
            const [iMin, iMax] = ing[axis] || [];
            if (iMin == null || iMax == null) continue;
            lo = Math.max(lo, iMin);
            hi = Math.min(hi, iMax);
          }
          if (!isFinite(lo) || !isFinite(hi) || hi <= lo) return null;
          return [lo, hi];
        };

        // Best-coverage band within primary lead's window. Sweep
        // events at each ingredient's range endpoints (clipped to
        // primary), count overlapping ranges per segment, return
        // the longest contiguous segment at peak coverage.
        const bestCoverageZone = (axis) => {
          if (!primary) return null;
          const [pMin, pMax] = primary[axis] || [];
          if (pMin == null || pMax == null) return null;
          // Build clipped ranges from every non-catalyst ingredient.
          const ranges = [];
          for (const ing of bandData) {
            const [iMin, iMax] = ing[axis] || [];
            if (iMin == null || iMax == null) continue;
            const lo = Math.max(iMin, pMin);
            const hi = Math.min(iMax, pMax);
            if (hi > lo) ranges.push([lo, hi]);
          }
          if (ranges.length < 2) return null;  // need primary + at least one other
          // Sweep: collect unique boundary points within [pMin, pMax].
          const points = new Set([pMin, pMax]);
          for (const [a, b] of ranges) { points.add(a); points.add(b); }
          const sorted = [...points].sort((a, b) => a - b);
          // Walk segments, count coverage. Track max-coverage segments.
          const segments = [];
          for (let i = 0; i < sorted.length - 1; i++) {
            const a = sorted[i], b = sorted[i + 1];
            if (b <= a) continue;
            const mid = (a + b) / 2;
            let count = 0;
            for (const [rA, rB] of ranges) {
              if (mid >= rA && mid <= rB) count++;
            }
            segments.push({ a, b, count });
          }
          if (segments.length === 0) return null;
          const maxCount = Math.max(...segments.map(s => s.count));
          if (maxCount < 2) return null;  // primary alone isn't a "zone"
          // Merge contiguous segments at maxCount; return the longest run.
          let best = null, run = null;
          for (const seg of segments) {
            if (seg.count === maxCount) {
              if (run && run.b === seg.a) {
                run.b = seg.b;
              } else {
                run = { a: seg.a, b: seg.b };
              }
              if (!best || (run.b - run.a) > (best.b - best.a)) {
                best = { a: run.a, b: run.b };
              }
            } else {
              run = null;
            }
          }
          if (!best) return null;
          return { range: [best.a, best.b], coverage: maxCount, total: bandData.length };
        };

        const RangeBands = ({ rangeMin, rangeMax, axis, selected, onSelect }) => {
          const span = rangeMax - rangeMin;
          if (span <= 0) return null;
          const empty = <div style={{ height: 16, marginTop: 2, marginBottom: 2 }} />;
          const renderBand = (lo, hi, color, tooltip, kind, isSelected) => {
            const cLo = Math.max(lo, rangeMin);
            const cHi = Math.min(hi, rangeMax);
            if (cHi <= cLo) return empty;
            const left = ((cLo - rangeMin) / span) * 100;
            const width = ((cHi - cLo) / span) * 100;
            // Wrapper is 16px tall (a comfortable tap target) but
            // only 6px in the middle is the visible band — the rest
            // is transparent click area so finger / mouse can land
            // on it reliably.
            return (
              <div style={{
                position: "relative",
                height: 16,
                marginTop: 2, marginBottom: 2,
              }}>
                <button
                  type="button"
                  title={tooltip}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelect && onSelect(isSelected ? null : kind);
                  }}
                  aria-label={tooltip}
                  style={{
                    position: "absolute",
                    left: `${left}%`,
                    width: `${width}%`,
                    top: 0, bottom: 0,
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    cursor: onSelect ? "pointer" : "default",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "stretch",
                  }}
                >
                  <div style={{
                    width: "100%",
                    height: 6,
                    background: color,
                    borderRadius: 2,
                    boxShadow: isSelected ? `0 0 0 1.5px ${theme.terra}` : "none",
                    transition: "box-shadow 0.15s ease",
                    pointerEvents: "none",
                  }} />
                </button>
              </div>
            );
          };

          const ix = intersect(axis);
          if (ix) {
            const tooltip = axis === "tempC"
              ? `Sweet spot: ${ix[0]}–${ix[1]}°C — tap for details`
              : `Sweet spot: ${Math.round(ix[0] / 60)}–${Math.round(ix[1] / 60)} min — tap for details`;
            return renderBand(ix[0], ix[1], "rgba(109,126,85,0.30)", tooltip, "sweet", selected === "sweet");
          }

          const fallback = bestCoverageZone(axis);
          if (fallback) {
            const [a, b] = fallback.range;
            const tooltip = axis === "tempC"
              ? `Compromise zone: ${a}–${b}°C (${fallback.coverage}/${fallback.total} ingredients in range) — tap for details`
              : `Compromise zone: ${Math.round(a / 60)}–${Math.round(b / 60)} min (${fallback.coverage}/${fallback.total} ingredients in range) — tap for details`;
            // Soft amber — calls attention without alarming. Using
            // theme.ochre family at ~30% opacity to match the green
            // band's visual weight while reading distinctly.
            return renderBand(a, b, "rgba(189,148,76,0.32)", tooltip, "compromise", selected === "compromise");
          }

          return empty;
        };

        // Description panel shown below a slider when a band is
        // tapped. Answers the literal question "what does this
        // colored bar represent?" — the engine math behind it has
        // gotten more nuanced as the slider bounds and warning
        // layers evolved, so users deserve a precise read.
        const BandDescription = ({ axis, kind }) => {
          if (!kind) return null;
          const totalIngs = bandData.length;
          let title, body, sub;
          if (kind === "sweet") {
            const ix = intersect(axis);
            if (!ix) return null;
            const fmt = axis === "tempC"
              ? `${ix[0]}–${ix[1]}°C`
              : `${Math.round(ix[0] / 60)}–${Math.round(ix[1] / 60)} min`;
            title = "Sweet spot";
            body  = `Every non-catalyst ingredient (${totalIngs}) is inside its own authored steep range somewhere in this band. Brewing here means no leaf is being stretched out of its preferred extraction window.`;
            sub   = fmt;
          } else {
            const fallback = bestCoverageZone(axis);
            if (!fallback) return null;
            const [a, b] = fallback.range;
            const fmt = axis === "tempC"
              ? `${a}–${b}°C`
              : `${Math.round(a / 60)}–${Math.round(b / 60)} min`;
            title = "Compromise zone";
            body  = `No single ${axis === "tempC" ? "temperature" : "time"} satisfies all the leaves at once. This band is the longest run where the most ingredients (${fallback.coverage} of ${fallback.total}) overlap inside the primary lead's window. The remaining ${fallback.total - fallback.coverage} sit outside their authored range — slightly under- or over-extracted but not broken.`;
            sub   = fmt;
          }
          return (
            <div style={{
              marginTop: 8,
              padding: "8px 10px",
              borderLeft: `2px solid ${kind === "sweet" ? theme.sage : theme.ochre}`,
              background: kind === "sweet"
                ? "rgba(109,126,85,0.08)"
                : "rgba(189,148,76,0.10)",
              borderRadius: "2px 6px 6px 2px",
            }}>
              <div style={{
                fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: kind === "sweet" ? theme.sageDeep : theme.ochre,
                marginBottom: 3,
              }}>
                {title} · {sub}
              </div>
              <div style={{
                fontFamily: ff.serif, fontSize: 12, color: theme.inkSoft,
                lineHeight: 1.5, fontStyle: "italic",
              }}>
                {body}
              </div>
            </div>
          );
        };

        return (
          <>
            {/* Temp + time sliders. Sit BELOW the maps now that the
                maps are fixed-height (per-track normalization keeps
                each band's intensity stable; only the vertical
                indicator moves). The user reads the envelope first,
                then aims for a point in it with the sliders. */}
            <div style={{ marginTop: 14, marginBottom: 14 }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "baseline",
                marginBottom: 6,
              }}>
                <label style={{
                  fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.08em",
                  textTransform: "uppercase", color: theme.inkSoft,
                }}>
                  Water
                </label>
                <div style={{ fontFamily: ff.mono, fontSize: 13, color: theme.ink }}>
                  {displayTemp}
                </div>
              </div>
              <input
                type="range"
                min={tempCRange[0]}
                max={tempCRange[1]}
                step={1}
                value={tempC}
                onChange={(e) => setTempC(Number(e.target.value))}
                style={{
                  width: "100%",
                  accentColor: theme.terra,
                }}
              />
              <RangeBands
                rangeMin={tempCRange[0]} rangeMax={tempCRange[1]} axis="tempC"
                selected={bandSelected.tempC}
                onSelect={(k) => selectBand("tempC", k)}
              />
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontFamily: ff.mono, fontSize: 10, color: theme.ash, marginTop: 2,
              }}>
                <span>{tempMinDisplay}°</span>
                <span>{tempMaxDisplay}°</span>
              </div>
              <BandDescription axis="tempC" kind={bandSelected.tempC} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "baseline",
                marginBottom: 6,
              }}>
                <label style={{
                  fontFamily: ff.sans, fontSize: 11, letterSpacing: "0.08em",
                  textTransform: "uppercase", color: theme.inkSoft,
                }}>
                  Steep
                </label>
                <div style={{ fontFamily: ff.mono, fontSize: 13, color: theme.ink }}>
                  {displayTime}
                </div>
              </div>
              <input
                type="range"
                min={timeSRange[0]}
                max={timeSRange[1]}
                step={15}
                value={timeS}
                onChange={(e) => setTimeS(Number(e.target.value))}
                style={{
                  width: "100%",
                  accentColor: theme.sage,
                }}
              />
              <RangeBands
                rangeMin={timeSRange[0]} rangeMax={timeSRange[1]} axis="timeS"
                selected={bandSelected.timeS}
                onSelect={(k) => selectBand("timeS", k)}
              />
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontFamily: ff.mono, fontSize: 10, color: theme.ash, marginTop: 2,
              }}>
                <span>{Math.round(timeSRange[0] / 60)} min</span>
                <span>{Math.round(timeSRange[1] / 60)} min</span>
              </div>
              <BandDescription axis="timeS" kind={bandSelected.timeS} />

              {/* No-overlap warning — fires when the blend has 2+ lead
                  ingredients whose timeS ranges don't share a single
                  window. A matcha (15-30s) + chamomile (300-420s)
                  blend has no steep where both extract correctly;
                  whatever the slider lands on, one lead is wrong.
                  Only fires on lead vs lead — accents and
                  catalysts are intentionally stretched. */}
              {ingredients.length >= 2 && (() => {
                const leads = ingredients
                  .filter(({ role }) => (role || "lead") === "lead")
                  .map(({ id }) => ({ id, meta: INGREDIENTS[id] }))
                  .filter(({ meta }) => meta?.timeS);
                if (leads.length < 2) return null;
                const intersectLo = Math.max(...leads.map(({ meta }) => meta.timeS[0]));
                const intersectHi = Math.min(...leads.map(({ meta }) => meta.timeS[1]));
                if (intersectLo <= intersectHi) return null;
                // Identify the two leads with the most extreme tension
                // — one with the highest min, one with the lowest max.
                const earliestEnder = leads.reduce((a, b) =>
                  a.meta.timeS[1] < b.meta.timeS[1] ? a : b);
                const latestStarter = leads.reduce((a, b) =>
                  a.meta.timeS[0] > b.meta.timeS[0] ? a : b);
                return (
                  <div style={{
                    marginTop: 10,
                    padding: "8px 10px",
                    borderLeft: `2px solid ${theme.terra}`,
                    background: "rgba(176,84,47,0.08)",
                    borderRadius: "2px 6px 6px 2px",
                    fontFamily: ff.serif, fontSize: 12.5,
                    color: theme.ink, lineHeight: 1.5,
                  }}>
                    <span style={{ color: theme.terra, fontStyle: "normal", fontWeight: 500 }}>
                      No shared steep window.
                    </span>{" "}
                    <span style={{ color: theme.terra, fontStyle: "normal" }}>
                      {earliestEnder.meta.name}
                    </span>{" "}
                    finishes at {Math.round(earliestEnder.meta.timeS[1] / 60)} min while{" "}
                    <span style={{ color: theme.terra, fontStyle: "normal" }}>
                      {latestStarter.meta.name}
                    </span>{" "}
                    needs at least {Math.round(latestStarter.meta.timeS[0] / 60)} min — wherever the slider
                    lands, one lead won't extract right. Best to brew these separately.
                  </div>
                );
              })()}

            </div>
          </>
        );
      })()}


      {/* Warnings — masking, ceiling, paradox, tannin, aromatic.
          Sit between the slider levers and the profile bars so the user
          can adjust steep/temp and immediately see whether the cup is
          pulling tannins or hitting another ceiling. Outsiders are
          shown inline above with the per-ingredient pills; filter here
          to avoid duplication. */}
      {(() => {
        // Cup-level warnings only — per-ingredient outsider and
        // over-pull warnings now surface in the selected-pill detail
        // box. Cup-level tannin/aromatic (no ingredient-name prefix)
        // and masking/paradox/ceiling stay here.
        const filtered = (brew.warnings || []).filter(w =>
          w.kind !== "outsider" && !/is being over-pulled/.test(w.text || "")
        );
        if (filtered.length === 0) return null;
        // Per-ingredient over-pull warnings always start with the
        // ingredient name and " is being over-pulled — ". Split on
        // that pattern to color the name in sage green so a glance
        // links the warning to which ingredient triggered it.
        const renderText = (text) => {
          const m = text.match(/^(.+?)\s+(is being over-pulled — .+)$/);
          if (!m) return text;
          return (
            <>
              <span style={{ color: theme.sageDeep, fontStyle: "normal", fontWeight: 500 }}>
                {m[1]}
              </span>
              {" "}{m[2]}
            </>
          );
        };
        // Tradition / house preface — when warnings fire on a curated
        // traditional or a Herbanium house signature, prepend a short
        // italic note reframing them as character notes the recipe
        // expects. The model's bitter/tannic ladder is tuned for a
        // generic palate; in chai or yancha the push is the point,
        // and the user shouldn't read the warning band as "this cup
        // is broken." The warnings still render so the user sees
        // WHY the tradition stretches the leaf.
        const showTraditionPreface = isTraditional || isHouse;
        const prefaceText = isTraditional
          ? "The stretch is the tradition — read these as character notes the cup expects, not flaws to fix."
          : "This house recipe is tuned with the stretch baked in — these are the trade-offs that make it work.";
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4, marginBottom: 14 }}>
            {showTraditionPreface && (
              <div style={{
                fontFamily: ff.serif, fontSize: 12.5,
                color: theme.inkSoft, lineHeight: 1.5,
                paddingBottom: 6,
                borderBottom: `1px dashed ${theme.ruleSoft}`,
              }}>
                {prefaceText}
              </div>
            )}
            {filtered.map((w, i) => {
              const accent = w.kind === "ceiling" ? theme.terra
                : w.kind === "tannin" ? theme.terra
                : w.kind === "aromatic" ? theme.terra
                : w.kind === "caffeine" ? theme.terra
                : w.kind === "paradox" ? theme.sageDeep
                : theme.ash;
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 8,
                  paddingLeft: 8,
                  borderLeft: `2px solid ${accent}`,
                }}>
                  <div style={{
                    fontFamily: ff.serif, fontSize: 13,
                    color: theme.ink, lineHeight: 1.45,
                    fontWeight: 400,
                  }}>
                    {renderText(w.text)}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Cup summary — dominant 1–2 effects and flavors as small
          pills matching the predicted-taste row's exact dimensions.
          Threshold-gated in the algorithm so quiet cups don't claim
          a read. Pills render as <button> elements to inherit the
          same UA reset (font-size, line-height) as the predicted-
          taste row's buttons — using <span> here picked up parent
          line-height and made the pills visibly taller. Eyebrow
          label sits inline to the left of each row. */}
      {/* Blended Mood / Blended Flavor summary removed — the
          dashed "blend" pill at the top of the ingredient row now
          carries the merged-profile view (under "moods" and
          "flavors" labels in its detail card). */}

      {/* Synergy tags — multi-effect bonuses the cup actually carries. */}
      {brew.synergyTags && brew.synergyTags.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {brew.synergyTags.map(tag => (
              <span key={tag} style={{
                fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.08em",
                textTransform: "uppercase", color: theme.sageDeep,
                padding: "3px 9px",
                background: "rgba(98, 124, 92, 0.10)",
                border: `1px solid ${theme.sageDeep}`, borderRadius: 999,
              }}>{tag}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

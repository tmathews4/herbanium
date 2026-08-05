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
import { createPortal } from "react-dom";
import { theme, ff } from "../theme";
import { useBrewDockId } from "../helpers/dock";
import { useUnit, cToF, gramsToTsp, formatTsp } from "../units/units";
import { resolveBlendAtBrew, computeBrewProfile, TRADITION_TIME_TOLERANCE_S } from "../algo/compose";
import { unionAndPadTempRange, unionAndPadTimeRange, timeStepFor } from "../algo/brewBounds";
import { INGREDIENTS } from "../data/ingredients";
import { FlavorMap, MindMap, BodyMap, PalateMap } from "./FlavorMap";
import { restHintForCelsius } from "../helpers/misc";
import { usePersistedState } from "../hooks/usePersistedState";

// Caffeine load thresholds (mg). The "too much" tick lines up with
// where perception.js's high-caffeine warning fires (130mg — past a
// normal cup of coffee, into doubled-up / strong-second-cup
// territory). Caution at 80mg marks "this is a real cup of caffeine
// now" — about where a regular black tea / mid-coffee lands. The
// 250mg ceiling holds for stacked caffeine-bearing leaves.
const CAFFEINE_MAX_MG = 250;
const CAFFEINE_GENTLE_MAX_MG = 40;
const CAFFEINE_CAUTION_MG = 80;
const CAFFEINE_WARN_MG = 130;

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
      {/* State-aware advisory band. Three flavors share one shape:
          - gentle (< 40 mg): sage/green — genuinely light cup
          - at edge (= 130 mg): ochre/yellow — right on the line
          - over (> 130 mg): terra/red — past the line, alarm
          The 40-129 mg range gets NO advisory — that's normal-cup
          territory (regular black tea, mid sencha, etc.). The bar's
          color and the numeric readout already carry the signal;
          a "gentle pour" badge on every breakfast tea felt like a
          gold-star sticker for drinking tea. */}
      {(() => {
        const gentle = mg > 0 && mg < CAFFEINE_GENTLE_MAX_MG;
        const advisory = past
          ? {
              accent: "#B0542F",
              bg: "rgba(176, 84, 47, 0.07)",
              tag: "over the line",
              body: "likely to read wired or jittery for caffeine-sensitive bodies.",
            }
          : atEdge
          ? {
              accent: "#A57836",
              bg: "rgba(165, 120, 54, 0.07)",
              tag: "at the edge",
              body: "a deliberate strong cup — one more part and it tips over.",
            }
          : gentle
          ? {
              accent: "#627C5C",  // sageDeep
              bg: "rgba(98, 124, 92, 0.08)",
              tag: "gentle pour",
              body: "well under the heads-up line — easy on the system.",
            }
          : null;
        if (!advisory) return null;
        return (
          <div style={{
            marginTop: 8,
            padding: "8px 10px 8px 12px",
            borderLeft: `2px solid ${advisory.accent}`,
            background: advisory.bg,
            borderRadius: "0 6px 6px 0",
            fontFamily: ff.serif, fontSize: 12.5,
            color: theme.ink, lineHeight: 1.45,
          }}>
            <span style={{
              fontFamily: ff.sans, fontSize: 9, letterSpacing: "0.16em",
              textTransform: "uppercase", color: advisory.accent,
              marginRight: 8, fontWeight: 600,
            }}>{advisory.tag}</span>
            {advisory.body}
          </div>
        );
      })()}
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
  tourStep = null,          // active guided-tour step id, when the Blend
                            // tour is running. Only used to put the strips
                            // in Simple mode for the steps that need the
                            // short layout — see the effect below.
  familyModeOverride = null,// tour demo only: forces what the strips SHOW
                            // without touching the user's saved preference,
                            // so the Simple/Detailed step can flip between
                            // the two and leave the choice as it found it.
  controlsOpenOverride = null, // tour demo only: opens or shuts the pinned
                            // brew bar. Same idea, and the tour needs it for
                            // a harder reason than presentation — the slider
                            // step targets an element that only exists while
                            // the bar is open.
}) => {
  const { unit, weightUnit } = useUnit();

  // Simple/Detailed mode for the FLAVOUR strip. It used to drive the
  // mood strip too, and no longer does: every mood family became
  // single-leaf when `warm` split into comfort and heat, so Simple and
  // Detailed render identical rows there and the control was doing
  // nothing. Flavour still has real depth — earthy holds 22 tokens —
  // which is where a rollup is worth a toggle.
  // Default to Detailed (familyMode=false) — the leaf-level read is
  // the explorer's reason for being, and curious users seeing
  // "smoked / pine / tar / leather" learn more than the Smoky
  // rollup. Persisted so users who prefer Simple keep that across
  // sessions after flipping.
  const [familyMode, setFamilyMode] = usePersistedState("explorerFamilyMode", false);
  // OPEN by default, and persisted.
  //
  // It shipped collapsed when the block was ~230px and opening it cost a
  // quarter of the screen. One axis at a time took it to 85px, which
  // changed the trade: a first-time user who never taps the row never
  // learns the cup is adjustable at all, and that's the more expensive
  // failure. So the sliders are there on arrival.
  //
  // Persisted for the other half of it. An unpersisted default-open
  // would re-open on EVERY visit, so a user who learned the control and
  // wanted the screen back could never make that stick — the tax would
  // fall hardest on the people who least need the prompt.
  const [controlsOpen, setControlsOpen] = usePersistedState("explorerControlsOpen", true);
  // Which slot these controls dock into. The tab dock by default; a
  // full-screen overlay that covers the tab bar provides its own, since
  // controls portaled under it are unreachable. See helpers/dock.js.
  const dockId = useBrewDockId();
  // The dock slot itself. It's a DOM node outside this tree, so it's
  // read rather than reffed.
  //
  // Normally the initializer finds it: this component sits behind a
  // lazy() boundary, so the host — and its dock with it — is committed
  // before we ever render. The effect is the safety net for the case
  // where it isn't, because a null here means the controls silently
  // never appear. It re-reads the same node and React bails on the
  // identical value.
  const [brewDock, setBrewDock] = useState(() => document.getElementById(dockId));
  // Re-reads on mount, and again if the host changes which dock it
  // wants. Normally lands on the identical node, so React bails rather
  // than cascading. This trips react-hooks/set-state-in-effect, which
  // can't be suppressed by a directive (the compiler-based rules ignore
  // them — see the three unsuppressed ones already in App.jsx). Kept
  // anyway: a null dock means the controls silently never appear, and a
  // lint error is the cheaper of the two.
  useEffect(() => { setBrewDock(document.getElementById(dockId)); }, [dockId]);

  // Guided tour: the tour's toggle step explains Simple vs Detailed and
  // leaves the strips on Simple. That isn't only pedagogy — family rows
  // alone are short enough that the flavor/mood bars and the temp/steep
  // sliders fit on one phone screen together, which is exactly what the
  // two steps after this one teach (watch the bars move as you drag).
  // Detailed's leaf rows push the sliders off the bottom. Flipping the
  // persisted preference is intended: the user is left where the tour
  // put them, and the toggle they were just shown flips it back.
  React.useEffect(() => {
    if (tourStep === "blend-mode" && !familyMode) setFamilyMode(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourStep]);
  // What the strips render. The override is transient demo state; the
  // persisted preference is what survives the tour.
  const shownFamilyMode = familyModeOverride ?? familyMode;
  // The tour's slider step has to open the panel — it teaches a control
  // that is collapsed by default, so pointing at it while closed would
  // target an element that isn't rendered.
  const shownControlsOpen = controlsOpenOverride ?? controlsOpen;
  // Which of the two brew sliders is on screen. Only one is, so each
  // keeps the full width — see the note on the control block below.
  //
  // Opens on TIME, and it's first in the pill order for the same
  // reason. Time steps by the second against temperature's 5°C notches
  // — hundreds of positions against six — so dragging it moves the
  // prediction bars as a gradient rather than in six jumps, which is
  // what a first-time user needs to see to understand that the sliders
  // drive the graph at all. Temperature is also the parameter a
  // newcomer is least likely to want to change.
  const [axis, setAxis] = useState("timeS");
  // The tour's demo oscillates steep time so the user watches the
  // prediction bars respond. If Temp happened to be the axis showing,
  // they'd watch the bars move beside a slider that doesn't — the
  // lesson inverted. Those two steps force Time; every other step
  // leaves the user's own choice alone.
  const tourAxis = (tourStep === "blend-graph" || tourStep === "blend-sliders") ? "timeS" : null;
  const shownAxis = tourAxis ?? axis;

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
    ? resolveBlendAtBrew(ingredients, tempC, timeS, undefined, undefined, false, false)
    : resolveBlendAtBrew(ingredients, tempC, timeS, defaultTempC, defaultTimeS, curated, isTraditional);

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

      {/* Flavor + mood across the temperature envelope. (Palate/balance
          used to live here too; it moved below the sliders — see the
          note there.)
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
      <div data-tour="blend-graph" style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{
          display: "flex", justifyContent: "flex-end", alignItems: "center",
        }}>
          {/* During the tour's Simple/Detailed steps the toggle takes a
              terra outline and a slow pulse of its own. The spotlight
              already lights the whole strip block — which is right,
              since what the toggle DOES is the lesson — but that leaves
              the control itself just one more thing inside a large
              bright area. The second, smaller signal says which part to
              actually look at. Terra rather than the spotlight's white
              so the two read as different jobs: the halo is "look
              here", this is "this is the control". */}
          {/* Injected for the axis-pill step too. That control is in the
              dock, several hundred lines away in a portal, but the
              keyframes are global once mounted and this block always
              renders — so one definition serves both rather than two
              copies drifting apart. */}
          {(tourStep === "blend-mode" || tourStep === "blend-axis") && (
            <style>{`
              @keyframes tourTogglePulse {
                0%, 100% { box-shadow: 0 0 0 0 rgba(176,84,47,0.55); }
                50%      { box-shadow: 0 0 0 6px rgba(176,84,47,0.02); }
              }
              @media (prefers-reduced-motion: reduce) {
                @keyframes tourTogglePulse {
                  0%, 100% { box-shadow: 0 0 0 3px rgba(176,84,47,0.32); }
                }
              }
            `}</style>
          )}
          <span data-tour="blend-mode" style={{
            display: "inline-flex",
            border: tourStep === "blend-mode"
              ? `1.5px solid ${theme.terra}`
              : `1px solid ${theme.ruleSoft}`,
            borderRadius: 999,
            overflow: "hidden",
            animation: tourStep === "blend-mode"
              ? "tourTogglePulse 1.9s ease-in-out infinite"
              : undefined,
            transition: "border-color 0.3s ease",
          }}>
            {[
              { id: "simple",   label: "Simple"   },
              { id: "detailed", label: "Detailed" },
            ].map(opt => {
              const active = (opt.id === "simple") === shownFamilyMode;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    const want = opt.id === "simple";
                    if (want === shownFamilyMode) return;
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
          familyMode={shownFamilyMode}
        />
        {/* The mood strip is pinned to family mode and ignores the
            toggle. Every mood family is single-leaf since `warm` split
            into comfort and heat — twelve families, twelve tokens, 1:1
            — so Simple and Detailed produce identical rows there: a
            self-named lone leaf is suppressed into its own parent.
            Offering a control that changes nothing is worse than not
            offering it.

            Flavour is the opposite and keeps the toggle: `earthy`
            holds 22 tokens, `fresh` 14, `fruit` 13. That's where a
            rollup earns its keep. */}
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

        /* BREW CONTROLS — a row in the tab dock, above Blend /
           Herbanium, collapsed by default.

           They used to sit in the scroll flow between the graphs, which
           forced a constraint on everything around them: the bars and
           the sliders had to fit on one phone screen together or the
           user never saw the bars respond. That is why Palate moved and
           why the tour holds Simple mode. Moving them to the dock
           dissolves it — they're on screen whatever is scrolled above,
           and the dock is a flex sibling of the scroll pane, so the
           space they take is space the pane simply doesn't have rather
           than something they cover.

           The dock, not a floating bar over the page: the controls are
           app chrome, they should read as chrome, and a fixed overlay
           positioned against the VIEWPORT spans the whole browser
           window on desktop while the app itself is a 520px column.

           Collapsed by default because the graphs are what the screen
           is for. The collapsed row still reads the current brew, so
           nothing is hidden — only the means of changing it. It's
           styled as a peer of the sub-tab buttons underneath it, and
           behaves like one: tap to make it active, and it opens. The
           tour teaches the tap. */
        if (!brewDock) return null;
        // The wrapper is deliberately NOT scrollable. A max-height with
        // overflow would make it a scroll parent, and the guided tour
        // picks the pane it scrolls by looking for one — it would find
        // this and try to fit the prediction bars inside the brew
        // controls. The block is two sliders; if it ever outgrows the
        // dock, shorten it rather than scroll it.
        return createPortal(
          // No background of its own — the row takes the dock's, so it
          // reads as one continuous surface with the menu beneath it.
          // The hairline below is what separates the brew controls from
          // the sub-tabs; a second fill was doing that job twice.
          //
          // A tinted variant was tried and dropped. Transparency here
          // reveals nothing either: the dock is a flex SIBLING of the
          // scrolling page, not a layer over it, so there is no content
          // behind this row to show through. (The dock's inherited
          // backdrop-blur is vestigial for the same reason.) Anything
          // done here is flat colour, so the honest choice is the
          // quieter one.
          <div style={{ borderBottom: `1px solid ${theme.ruleSoft}` }}>
            <div style={{ padding: "8px 12px 0" }}>
              <button
                data-tour="blend-controls"
                onClick={() => setControlsOpen(v => !v)}
                aria-expanded={shownControlsOpen}
                style={{
                  width: "100%", background: "transparent", border: "none",
                  cursor: "pointer", padding: "6px 4px 8px",
                  display: "flex", alignItems: "baseline", justifyContent: "center", gap: 8,
                  // Matches the sub-tab buttons directly below: same
                  // face, same active underline, same colour switch.
                  fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.01em",
                  fontWeight: shownControlsOpen ? 600 : 500,
                  color: shownControlsOpen ? theme.terra : theme.inkSoft,
                  borderBottom: shownControlsOpen
                    ? `2px solid ${theme.terra}`
                    : "2px solid transparent",
                  marginBottom: -1,
                  transition: "color 0.2s ease, border-color 0.2s ease",
                }}
              >
                <span>Brew</span>
                <span style={{
                  fontFamily: ff.mono, fontSize: 11.5,
                  color: shownControlsOpen ? theme.terra : theme.ash,
                }}>
                  {/* M:SS, not "4 min". The row is the only readout
                      while the sliders are folded away, and rounding to
                      the minute would report 3:47 as "4 min" — which
                      undoes the second-level step the moment anyone
                      uses it. Same format the open panel shows, so
                      folding the row doesn't change the number. */}
                  {displayTemp} · {displayTime}
                </span>
                {/* Same chevron as the "more filters" toggle on Compose,
                    so an expanding control looks the same everywhere.
                    Rotation is inverted here because this panel opens
                    UPWARD out of the dock: pointing up means "expand",
                    pointing down means "close". */}
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden
                     style={{
                       transition: "transform 0.18s ease",
                       transform: shownControlsOpen ? "rotate(0deg)" : "rotate(180deg)",
                     }}>
                  <path d="M1.5 3 L4.5 6 L7.5 3"
                        stroke={shownControlsOpen ? theme.terra : theme.inkSoft}
                        strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </button>
            </div>
            {shownControlsOpen && (
              <div style={{ padding: "0 12px 4px" }}>
                <div data-tour="blend-sliders">
                  {/* ONE AXIS AT A TIME, chosen by the pill above it.
                      The two sliders read as a symmetric pair and are
                      nothing of the sort: temp moves in six 5°C notches
                      where steep is continuous to the second. Side by
                      side, steep would have fallen to a fraction of a
                      pixel per second on a 320px phone. Stacked, they
                      cost 128px of a pane the dock is already taking
                      from.

                      Swapping instead of splitting keeps the full width
                      for whichever slider is up, so steep gets every
                      pixel its resolution can use and temp — which
                      never needed the room — simply gets out of the
                      way. The collapsed row still reads both values, so
                      nothing is hidden by the choice; only one is
                      adjustable at a time, and you adjust one at a
                      time anyway. */}
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    gap: 8, marginTop: 8, marginBottom: 4,
                  }}>
                    {/* Same terra outline and slow pulse the
                        Simple/Detailed toggle takes during its own step,
                        and for the same reason. The spotlight lights the
                        whole brew window — correct, because what the
                        pills DO is swap what that window contains — but
                        that leaves the pills as one more thing inside a
                        large bright area. The second, smaller signal
                        says which part to look at. Terra rather than the
                        spotlight's white so the two read as different
                        jobs: the halo is "look here", this is "this is
                        the control". */}
                    <div data-tour="blend-axis" style={{
                      display: "inline-flex", flexShrink: 0,
                      border: tourStep === "blend-axis"
                        ? `1.5px solid ${theme.terra}`
                        : `1px solid ${theme.ruleSoft}`,
                      borderRadius: 999,
                      overflow: "hidden",
                      animation: tourStep === "blend-axis"
                        ? "tourTogglePulse 1.9s ease-in-out infinite"
                        : undefined,
                      transition: "border-color 0.3s ease",
                    }}>
                      {[["timeS", "Time", theme.sage], ["tempC", "Temp", theme.terra]]
                        .map(([key, label, accent]) => {
                          const on = shownAxis === key;
                          return (
                            <button
                              key={key}
                              data-testid={`brew-axis-${key}`}
                              onClick={() => setAxis(key)}
                              aria-pressed={on}
                              style={{
                                // A filled pill, not the sub-tabs' underline:
                                // the row of sub-tabs is inches below this and
                                // two underlined tab strips would read as two
                                // levels of navigation rather than a control.
                                padding: "3px 11px", border: "none", cursor: "pointer",
                                background: on ? accent : "transparent",
                                color: on ? theme.cream : theme.inkSoft,
                                fontFamily: ff.sans, fontSize: 10,
                                letterSpacing: "0.08em", textTransform: "uppercase",
                                fontWeight: on ? 600 : 500,
                                transition: "background 0.18s ease, color 0.18s ease",
                              }}
                            >{label}</button>
                          );
                        })}
                    </div>
                    <div style={{
                      display: "flex", alignItems: "baseline", gap: 6, minWidth: 0,
                    }}>
                      <span style={{
                        fontFamily: ff.mono, fontSize: 10, color: theme.ash,
                        whiteSpace: "nowrap",
                      }}>
                        {shownAxis === "tempC"
                          ? `${tempMinDisplay}–${tempMaxDisplay}°`
                          : `${Math.round(timeSRange[0] / 60)}–${Math.round(timeSRange[1] / 60)} min`}
                      </span>
                      {shownAxis === "tempC" && (() => {
                        const hint = restHintForCelsius(tempC);
                        if (!hint) return null;
                        return (
                          <span style={{
                            fontFamily: ff.serif, fontStyle: "italic", fontSize: 10.5,
                            color: theme.ash, textAlign: "right",
                          }}>{hint}</span>
                        );
                      })()}
                      <span style={{ fontFamily: ff.mono, fontSize: 13, color: theme.ink }}>
                        {shownAxis === "tempC" ? displayTemp : displayTime}
                      </span>
                    </div>
                  </div>
                  {/* HELD OFF THE SCREEN EDGES. Android's back gesture
                      and iOS's interactive-pop both claim a strip along
                      each side, so a slider running the full width hands
                      its last few degrees and seconds to the OS — you
                      reach for the end of the range and leave the
                      screen instead. The dock already insets 12px; this
                      adds enough to clear the ~20px the gesture zones
                      typically take.

                      On the wrapper rather than the input, so the range
                      bands underneath stay aligned with the track they
                      describe. */}
                  <div style={{ marginBottom: 6, padding: "0 12px" }}>
                    {shownAxis === "tempC" ? (
                      <>
                        <input
                          type="range"
                          aria-label="Water temperature"
                          min={tempCRange[0]}
                          max={tempCRange[1]}
                          step={5}
                          value={tempC}
                          onChange={(e) => setTempC(Number(e.target.value))}
                          style={{
                            width: "100%", display: "block", margin: 0,
                            accentColor: theme.terra,
                          }}
                        />
                        <RangeBands
                          rangeMin={tempCRange[0]} rangeMax={tempCRange[1]} axis="tempC"
                          selected={bandSelected.tempC}
                          onSelect={(k) => selectBand("tempC", k)}
                        />
                        <BandDescription axis="tempC" kind={bandSelected.tempC} />
                      </>
                    ) : (
                      <>
                        <input
                          type="range"
                          aria-label="Steep time"
                          min={timeSRange[0]}
                          max={timeSRange[1]}
                          step={timeStepFor(timeSRange)}
                          value={timeS}
                          onChange={(e) => setTimeS(Number(e.target.value))}
                          style={{
                            width: "100%", display: "block", margin: 0,
                            accentColor: theme.sage,
                          }}
                        />
                        <RangeBands
                          rangeMin={timeSRange[0]} rangeMax={timeSRange[1]} axis="timeS"
                          selected={bandSelected.timeS}
                          onSelect={(k) => selectBand("timeS", k)}
                        />
                        <BandDescription axis="timeS" kind={bandSelected.timeS} />
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>,
          brewDock,
        );
      })()}

      {/* No-overlap warning — fires when the blend has 2+ lead
          ingredients whose timeS ranges don't share a single window. A
          matcha (15-30s) + chamomile (300-420s) blend has no steep where
          both extract correctly; whatever the slider lands on, one lead
          is wrong. Only fires on lead vs lead — accents and catalysts
          are intentionally stretched.

          It sat with the steep slider until the controls moved into the
          tab dock. It's prose about the BLEND, not about where the
          slider is, and putting conditional prose in the dock made the
          dock's height jump by ~60px the moment a user added a second
          lead. Controls in the chrome, explanation on the page. */}
      {ingredients.length >= 2 && (() => {
        const leads = ingredients
          .filter(({ role }) => (role || "lead") === "lead")
          .map(({ id }) => ({ id, meta: INGREDIENTS[id] }))
          .filter(({ meta }) => meta?.timeS);
        if (leads.length < 2) return null;
        const intersectLo = Math.max(...leads.map(({ meta }) => meta.timeS[0]));
        const intersectHi = Math.min(...leads.map(({ meta }) => meta.timeS[1]));
        if (intersectLo <= intersectHi) return null;
        // Identify the two leads with the most extreme tension — one
        // with the highest min, one with the lowest max.
        const earliestEnder = leads.reduce((a, b) =>
          a.meta.timeS[1] < b.meta.timeS[1] ? a : b);
        const latestStarter = leads.reduce((a, b) =>
          a.meta.timeS[0] > b.meta.timeS[0] ? a : b);
        return (
          <div style={{
            marginBottom: 12,
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

      {/* Mind and Body read as what the cup DOES to you, after what it
          TASTES like (flavour, palate) above them.

          Palate used to live down here and the mood strip up there, on
          the reasoning that flavour and mood were the prediction and
          balance was the caveat. The four-window split changed the
          arithmetic: three strips above the sliders pushed them toward
          the fold and the tour's bars-and-sliders check reported the
          pane cramping (60% clear, down from 67%). Two up and two down
          is both a truer grouping and less vertical load above the
          controls.

          Pinning the controls settled the cramping for good — they no
          longer compete with the strips for the same screen — but the
          grouping is right on its own terms, so it stays. The "bars and
          sliders stay clear" test in e2e/tours.spec.ts still pins it. */}
      <div data-tour="blend-effects" style={{ marginBottom: 12 }}>
        <MindMap
          ingredients={ingredients}
          tempC={tempC}
          timeS={timeS}
          tempCRange={tempCRange}
          showAxis={false}
          familyMode
        />
        <BodyMap
          ingredients={ingredients}
          tempC={tempC}
          timeS={timeS}
          tempCRange={tempCRange}
          showAxis={false}
          familyMode
        />
      </div>

      {/* Caffeine load — pulled out of the panorama group and parked
          here in the consequence cluster, just below the sliders. The
          two temp-axis strips above the sliders (flavor / mood) share
          an envelope and read as one panorama; caffeine is a scalar
          gauge whose value barely shifts with temp/time. Living with
          the warnings keeps related "is this cup pushing too hard?"
          signals together and reduces eye-travel during slider drag —
          the user's finger is already in this region. */}
      {brew?.caffeineMg != null && brew.caffeineMg > 0 && (
        <div style={{ marginBottom: 12 }}>
          <CaffeineBar
            caffeineMg={brew.caffeineMg}
            totalG={(ingredients || []).reduce((s, it) => s + (Number(it?.g) || 0), 0)}
            totalTsp={(ingredients || []).reduce((s, it) => {
              const meta = INGREDIENTS[it?.id];
              if (!meta) return s;
              return s + gramsToTsp(Number(it?.g) || 0, meta.category);
            }, 0)}
            weightUnit={weightUnit}
          />
        </div>
      )}

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
        //
        // Caffeine-kind warnings are also filtered out — the caffeine
        // bar's own advisory band (gentle / at-edge / over-the-line)
        // above this list now carries the caffeine signal in a more
        // structured form, so the prose warning here would duplicate it.
        const filtered = (brew.warnings || []).filter(w =>
          w.kind !== "outsider"
          && w.kind !== "caffeine"
          && !/is being over-pulled/.test(w.text || "")
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
              // Warning severity → matching advisory-band styling from
              // the caffeine bar, so all the "this cup is pushing too
              // hard" signals share one visual language.
              //   red (terra)  — over the line: tannin, aromatic, ceiling
              //   yellow (ochre) — heads-up: edge cases (e.g. masking,
              //                    where one note is starting to bury
              //                    another but the cup isn't broken)
              //   sage         — paradox / informational: notable, not a
              //                    flaw — the cup walks both sides
              const sev = (w.kind === "tannin" || w.kind === "aromatic" || w.kind === "ceiling")
                ? "over"
                : (w.kind === "paradox") ? "info" : "edge";
              const advisory = sev === "over"
                ? { accent: "#B0542F", bg: "rgba(176, 84, 47, 0.07)", tag: w.kind === "ceiling" ? "ceiling" : (w.kind === "aromatic" ? "aromatic" : "over the line") }
                : sev === "edge"
                ? { accent: "#A57836", bg: "rgba(165, 120, 54, 0.07)", tag: w.kind === "masking" ? "masking" : "heads up" }
                : { accent: "#627C5C", bg: "rgba(98, 124, 92, 0.08)", tag: w.kind === "paradox" ? "paradox" : "note" };
              return (
                <div key={i} style={{
                  padding: "8px 10px 8px 12px",
                  borderLeft: `2px solid ${advisory.accent}`,
                  background: advisory.bg,
                  borderRadius: "0 6px 6px 0",
                  fontFamily: ff.serif, fontSize: 12.5,
                  color: theme.ink, lineHeight: 1.45,
                }}>
                  <span style={{
                    fontFamily: ff.sans, fontSize: 9, letterSpacing: "0.16em",
                    textTransform: "uppercase", color: advisory.accent,
                    marginRight: 8, fontWeight: 600,
                  }}>{advisory.tag}</span>
                  {renderText(w.text)}
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

      {/* Adaptogen caveat — fires when adaptogen-flagged ingredients
          (tulsi, ashwagandha, reishi, lion's mane, licorice) make up
          a meaningful share of the cup. These compounds build effect
          over weeks of daily use, not within a single cup — the
          per-cup grounding/calm readouts are honest about the
          chemistry that's extracted, but they overstate what one cup
          can shift. Surfaced only when ≥20% adaptogen by weight so
          the caveat tracks with cups that are actually adaptogen-led. */}
      {brew?.adaptogenShare >= 0.2 && (
        <div style={{
          marginTop: 14,
          padding: "8px 12px",
          borderLeft: `2px solid ${theme.sageDeep}`,
          background: "rgba(98, 124, 92, 0.06)",
          borderRadius: "0 6px 6px 0",
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 12,
          color: theme.inkSoft, lineHeight: 1.5,
        }}>
          Adaptogens in this mix contribute to the calm and grounding reads — their full effect builds over weeks of daily use, not within one cup.
        </div>
      )}

      {/* Honesty footer — the predictions are now precise enough
          (caffeine in mg, calm to a tenth) that users could over-
          trust them. This small italic line travels with the
          explorer everywhere it appears (BlendDetail, IngredientDetail,
          ComposeScreen) so the disclaimer is tied to the chart, not
          buried in a separate About page. */}
      <div style={{
        marginTop: 16,
        fontFamily: ff.serif, fontStyle: "italic", fontSize: 11,
        color: theme.ash, lineHeight: 1.5, textAlign: "center",
      }}>
        How a cup lands is partly chemistry, partly you. Treat predictions as a starting point.
      </div>
    </div>
  );
};

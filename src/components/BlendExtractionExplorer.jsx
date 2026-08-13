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

import React, { useState, useMemo, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { theme, ff } from "../theme";
import { useBrewDockId } from "../helpers/dock";
import { useUnit, cToF, gramsToTsp, formatTsp } from "../units/units";
import { resolveBlendAtBrew, computeBrewProfile, recommendedBrewTarget,
         TRADITION_TIME_TOLERANCE_S } from "../algo/compose";
import { unionAndPadTempRange, unionAndPadTimeRange, timeStepFor,
         recommendedBand } from "../algo/brewBounds";
import { INGREDIENTS } from "../data/ingredients";
import { PROFILE_TIME_REACH, EXTRACTION_PROFILES } from "../data/extractionProfiles";
import { FlavorMap, MindMap, BodyMap, PalateMap } from "./FlavorMap";
import { restHintForCelsius } from "../helpers/misc";
import { usePersistedState } from "../hooks/usePersistedState";
import { Arrival, Collapse } from "./Arrival";
import { EFFECT_SYNERGIES } from "../algo/perception";
import { SYNERGY_DESCRIPTIONS, PARADOX_DESCRIPTIONS } from "../data/vocabularyDescriptions";

// Caffeine load thresholds (mg). The "high" tick lines up with
// where perception.js's high-caffeine warning fires (130mg — past a
// normal cup of coffee, into doubled-up / strong-second-cup
// territory). Caution at 80mg marks "this is a real cup of caffeine
// now" — about where a regular black tea / mid-coffee lands. The
// 250mg ceiling holds for stacked caffeine-bearing leaves.
//
// The upper tick used to read "too much", which is a judgement the
// chemistry doesn't support — plenty of people drink past it happily
// and daily. The number is unchanged; only the claim about it is.
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

        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          fontFamily: ff.mono, fontSize: 11, color: labelColor,
        }}>
          {/* No ⚠. The number and the band below already say where the
              cup sits, and an alarm glyph on a strong tea told the
              drinker they'd done something wrong — which is a verdict,
              not a reading. */}
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
        }}>moderate</span>
        <span style={{
          position: "absolute",
          left: `${(CAFFEINE_WARN_MG / CAFFEINE_MAX_MG) * 100}%`,
          transform: "translateX(-50%)",
          color: past ? "#B0542F" : (atEdge ? "#A57836" : theme.ash),
        }}>high</span>
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
        /* DESCRIBE THE CUP, don't grade the drinker. "Too much" and
           "over the line" are verdicts, and they're the app's opinion
           rather than its chemistry — plenty of people drink well past
           this line on purpose and are fine. What's worth saying is
           what the cup will DO, and to whom: that's information, and
           the reader can decide whether it's a problem.

           The signal still has to land, though. A cup this strong
           reads as aggressive to most people who aren't used to it,
           so the register stays firm — "bracing", not "gentle pour
           with a caveat". */
        const advisory = past
          ? {
              accent: "#B0542F",
              bg: "rgba(176, 84, 47, 0.07)",
              tag: "high",
              body: "more caffeine than most cups carry — bracing if that's what you came for, "
                  + "wired or jittery if you're sensitive to it.",
            }
          : atEdge
          ? {
              accent: "#A57836",
              bg: "rgba(165, 120, 54, 0.07)",
              tag: "strong cup",
              body: "a deliberate strong cup — one more part and it climbs.",
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
          // Grows in. This band is the app noticing something — a cup
          // crossing into strong — and a notice that was simply always
          // there by the time you looked reads as a label, not a change.
          <Arrival duration={240} style={{
            marginTop: 8,
            padding: "8px 10px 8px 12px",
            borderLeft: `2px solid ${advisory.accent}`,
            background: advisory.bg,
            borderRadius: "0 6px 6px 0",
            fontFamily: ff.serif, fontSize: 12.5,
            color: theme.ink, lineHeight: 1.45, textAlign: "left",
          }}>
            <span style={{
              fontFamily: ff.sans, fontSize: 9, letterSpacing: "0.16em",
              textTransform: "uppercase", color: advisory.accent,
              marginRight: 8, fontWeight: 600,
            }}>{advisory.tag}</span>
            {advisory.body}
          </Arrival>
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
/* THE BREW DOCK ARRIVES, it doesn't appear.

   Adding a first ingredient conjured a whole row of chrome under the
   page in one frame, which reads as the layout breaking rather than a
   control showing up. This grows it to its own height instead.

   Measured, not guessed: the row is one height folded, another with
   the panel open, another again on the time axis. CSS can't know any
   of them — a max-height big enough for the tallest state makes the
   shortest one finish its travel in the first third and sit still for
   the rest, and grid-template-rows 0fr->1fr snapped instead of
   interpolating when it was tried (1px to 124px in a single frame).

   ONCE, on the element's first appearance. It runs off a ref rather
   than state so a re-render can't retrigger it — the dock re-renders
   on every slider frame, and a row that re-grew each time you dragged
   the temperature would be a nightmare rather than a flourish.

   Reduced motion skips it entirely rather than styling it away. This
   is chrome the user needs; the honest fallback is for it to be
   there, immediately. */
const useDockArrival = (enabled) => {
  const ref = useRef(null);
  const played = useRef(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!enabled || !el || played.current) return;
    played.current = true;
    if (typeof window === "undefined" || !el.animate) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
    const height = el.scrollHeight;
    if (!height) return;
    el.classList.add("brew-dock-arriving");
    const anim = el.animate(
      [
        { height: "0px", opacity: 0 },
        { height: `${height}px`, opacity: 1 },
      ],
      /* A GENTLE S, not an ease-out-expo. The first attempt used
         cubic-bezier(0.16, 1, 0.3, 1), which spends 64% of the travel
         in the first 15% of the time — measured, not guessed — and
         the row still read as popping. The eye only registers motion
         it can follow, so the distance is spread across the duration
         instead of being front-loaded onto it. */
      { duration: 380, easing: "cubic-bezier(0.33, 0, 0.2, 1)" },
    );
    // Hand the height back to the layout the moment it's arrived —
    // holding a pixel height would freeze the row at whatever size it
    // happened to be when it landed, and the panel folds and unfolds.
    anim.finished.catch(() => {}).then(() => el.classList.remove("brew-dock-arriving"));
  }, [enabled]);
  return ref;
};

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
  axisOverride = null,      // tour demo only: forces which slider is
                            // bound, so the pills step can show each in
                            // turn on the user's own Next tap.
  brewAction = null,        // node rendered at the foot of the open brew
                            // panel — the Brew button on Compose. Passed
                            // in rather than built here: what it DOES is
                            // blend logic (duplicate detection, the mood
                            // prompt) and belongs to the screen that owns
                            // the pot; this component owns only where it
                            // sits. Absent on the detail screens, which
                            // have their own brew affordance.
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
  /* CLOSED on launch, and NOT remembered. No exceptions — the tour does
     not hand it back open, and the reason is worth reading before adding
     one.

     The history, because this has moved twice. It shipped collapsed when
     the block was ~230px and opening it cost a quarter of the screen.
     One axis at a time took it to 85px, and it went open-and-persisted
     on the argument that a first-time user who never taps the row never
     learns the cup is adjustable at all.

     The tour is what settled that argument. Discovery is the tutorial's
     job now, and it does it explicitly: the row is folded for the first
     seven steps, step 8 OPENS it to teach the sliders, and the last step
     folds it again while saying so. Opening and closing are both
     demonstrated, in that order, at the moment each is wanted. Paying
     for discovery a second time, on every launch forever, buys nothing
     the tour has not already delivered.

     Not persisted, rather than persisted-with-a-false-default. A false
     default still records the first tap for good, which is the same
     stickiness pointed the other way: expanding a panel to read one cup
     is not a standing preference about the app. `explorerFamilyMode`
     above stays persisted because that one genuinely is — how you want
     the strips read, not whether something happens to be open now.

     THE TOUR MUST NOT LEAVE IT OPEN, and there was briefly an effect
     here that did. It fired when the tour released its override, on the
     reasoning that someone who just watched the sliders explained should
     not find the row shut in the same breath. That reasoning is fine and
     the step it lands on is not: the tour's LAST step is
     `openControls: false` on purpose — it folds the row, says "it's
     there whenever you want it", and hands the screen back the way the
     user will actually leave it. Re-opening a beat later undid the final
     thing the tour taught. Two mechanisms, one screen state, disagreeing
     about it; the tour's is the deliberate one. */
  const [controlsOpen, setControlsOpen] = useState(false);
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
  // Which synergy pill is explaining itself. One at a time.
  const [synergyOpen, setSynergyOpen] = useState(null);
  /* Bumped whenever the app moves the brew rather than the user
     dragging it. The strips' temperature marker reads this to tell a
     jump from a drag — it has to be instant under a finger and
     followable under a tap, and the value alone can't say which. */
  const [brewJump, setBrewJump] = useState(0);
  const jumpTo = (setter) => (value) => { setter(value); setBrewJump(n => n + 1); };
  // Grows the row into place the first time it lands in the dock.
  const dockArrivalRef = useDockArrival(!!brewDock);
  // Re-reads on mount, and again if the host changes which dock it
  // wants. Normally lands on the identical node, so React bails rather
  // than cascading. This trips react-hooks/set-state-in-effect, which
  // can't be suppressed by a directive (the compiler-based rules ignore
  // them — see the three unsuppressed ones already in App.jsx). Kept
  // anyway: a null dock means the controls silently never appear, and a
  // lint error is the cheaper of the two.
  // NO DEPENDENCY ARRAY, deliberately. Keyed on [dockId] this ran once
  // and cached the node — and a cached node is the precondition for the
  // bug it was meant to prevent. If the host ever re-creates its slot,
  // or renders it after this component first looked, the cache holds a
  // DETACHED div: the portal renders into nothing, the slot sitting in
  // the document stays empty, and the page shows a bare band where the
  // brew row belongs. Reported from a saved recipe, twice, and not
  // reproducible from the dev seed — which is its own argument for
  // removing the precondition rather than hunting the trigger.
  //
  // Running every render costs one getElementById and sets state only
  // when the node actually differs, so React bails in the normal case.
  useEffect(() => {
    const el = document.getElementById(dockId);
    if (el !== brewDock) setBrewDock(el);
  });

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
  /* No step-name list here any more, and that is the point.

     This used to be `tourStep === "blend-graph" || "blend-sliders"` —
     a second copy of which steps force which axis, living a file away
     from the steps that know. It drifted the moment the brew row's
     default changed, and it had to be edited again to follow. The steps
     that need Time bound now say `axisMode: "timeS"` themselves, which
     arrives here as `axisOverride` like every other declared demo state.

     So: the tour's choice if it made one, otherwise the user's own. */
  const shownAxis = axisOverride ?? axis;

  /* No band-selection state any more. Tapping the word under a slider
     used to open a description panel under that slider; now it sets the
     brew to what the word names and that is the whole of it. A control
     that both acts and lectures asks the user to work out which of the
     two they just triggered. */

  const tempCRange = useMemo(() => unionAndPadTempRange(ingredients, INGREDIENTS), [ingredients]);
  const timeSRange = useMemo(() => unionAndPadTimeRange(ingredients, INGREDIENTS, PROFILE_TIME_REACH), [ingredients]);

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
      // One padding for every brew window. `compact` used to shave
      // 2px here for Compose alone, which is the whole reason the
      // panels read as three different components.
      padding: "14px 14px 16px",
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
              copies drifting apart.

              TWO RINGS, AND A THEMED COLOUR. The old pulse was a single
              ring reaching 6px and fading to 0.02 alpha — close to
              invisible by the end of its own travel — and it hardcoded
              rgba(176,84,47), which is the LIGHT terra. In dark mode that
              put a dull, dark terracotta against a dark ground: the app
              already carries a themed --terra-rgb (194,102,66 in dark)
              and the pulse simply wasn't using it.

              Now it echoes — an inner ring at the control's edge and an
              outer one trailing it, out to 17px rather than 6. Two rings
              read as a pulse travelling outward where one reads as an
              edge that brightens, which is the part that was getting
              lost. */}
          {["blend-mode", "blend-axis", "blend-brew", "blend-ranges"].includes(tourStep) && (
            <style>{`
              @keyframes tourTogglePulse {
                0%, 100% {
                  box-shadow: 0 0 0 0   rgba(var(--terra-rgb), 0.75),
                              0 0 0 5px rgba(var(--terra-rgb), 0.22);
                }
                50% {
                  box-shadow: 0 0 0 9px  rgba(var(--terra-rgb), 0.14),
                              0 0 0 17px rgba(var(--terra-rgb), 0.05);
                }
              }
              @media (prefers-reduced-motion: reduce) {
                /* No travel, so the rings have to carry it on contrast
                   alone — held brighter than a moving pulse would need. */
                @keyframes tourTogglePulse {
                  0%, 100% {
                    box-shadow: 0 0 0 3px rgba(var(--terra-rgb), 0.45),
                                0 0 0 8px rgba(var(--terra-rgb), 0.18);
                  }
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
                  data-testid={`blend-mode-${opt.id}`}
                  aria-pressed={active}
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
        {/* Hooked on its own because the Simple/Detailed steps light
            THIS and not the palate below it. The toggle only drives
            FlavorMap — PalateMap takes no familyMode and its rows are
            identical in both modes — so lighting the whole graph
            promised a change in a strip that never changes. */}
        <div data-tour="blend-flavors">
          <FlavorMap
          jumpNonce={brewJump}
            ingredients={ingredients}
            tempC={tempC}
            timeS={timeS}
            tempCRange={tempCRange}
            showAxis={false}
            familyMode={shownFamilyMode}
          />
        </div>
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
          jumpNonce={brewJump}
          warnings={brew?.warnings || []}
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

        /* WHICH RANGE IS RECOMMENDED — resolved once, used three
           times: the rail paints it, the word names it, and tapping
           the word lands in it. The geometry lives in algo/brewBounds
           so the opening brew point can reach the same answer; only
           the copy is ours.

           WHERE THE OTHER SLIDER IS SET CHANGES THE ANSWER. The band
           is read off each profile's own diagonal, so dragging the
           temperature slides the recommended steep and vice versa —
           the tradeoff the two controls were hiding. */
        const resolveBand = (axis) => {
          const band = recommendedBand({
            items: bandData,
            primary,
            profiles: EXTRACTION_PROFILES,
            axis,
            otherValue: axis === "timeS" ? tempC : timeS,
          });
          if (!band) return null;
          const { lo, hi, kind, coverage, total } = band;
          /* "RESEARCHED AT", not "ideal", for the coupled band: it is
             where the docs actually sampled this pairing, and calling
             that ideal would claim a compensation model the research
             doesn't contain. Nothing here knows what hot-and-short
             tastes like, because nobody brewed it. */
          const label = kind === "compromise"
            ? `Compromise zone: ${axis === "tempC"
                ? `${lo}–${hi}°C`
                : `${Math.round(lo / 60)}–${Math.round(hi / 60)} min`}`
              + ` (${coverage}/${total} ingredients in range)`
            : axis === "tempC"
              ? `Sweet spot: ${lo}–${hi}°C`
              : `Sweet spot: ${Math.round(lo / 60)}–${Math.round(hi / 60)} min`;
          return { lo, hi, kind, hint: `${label} — tap to brew here` };
        };

        /* THE TOUR'S ANCHOR, back on the coloured span itself.

           This was moved to the whole rail-and-word wrapper to kill an
           outlined capsule that looked like a leftover widget. That
           fixed the relic and lost the point: the step is called "the
           recommended range", and highlighting the entire toggle bar
           says "this is the slider", which the user can see.

           So the box is back, tracing exactly the coloured stretch —
           and this time it draws NOTHING of its own. No border, no
           fill. The spotlight cutout and the pulse are the highlight;
           the ghost only says where to put them. That was the actual
           bug the first time round: a 1.5px terra outline on an
           invisible box, which is a capsule.

           FULL WIDTH, no thumb inset. The old version inset itself by
           half a thumb while the track's gradient runs edge to edge, so
           the highlight sat a few pixels off the colour it was meant to
           be tracing — measured at 1.6px left and 3.4px right. */
        const RangeGhost = ({ rangeMin, rangeMax, axis }) => {
          const span = rangeMax - rangeMin;
          if (span <= 0) return null;
          const band = bandWithin(axis, rangeMin, rangeMax);
          if (!band) return null;
          const pct = (v) => Math.max(0, Math.min(100,
            ((Math.max(rangeMin, Math.min(rangeMax, v)) - rangeMin) / span) * 100));
          const lo = pct(band.lo), hi = pct(band.hi);
          if (hi <= lo) return null;
          return (
            <div aria-hidden style={{
              position: "absolute", left: 0, right: 0, top: 0, height: 20,
              pointerEvents: "none",
            }}>
              <div
                data-tour="blend-ranges"
                style={{
                  position: "absolute", left: `${lo}%`, width: `${hi - lo}%`,
                  top: "50%", height: 12, transform: "translateY(-50%)",
                  borderRadius: 3,
                  animation: tourStep === "blend-ranges"
                    ? "tourTogglePulse 1.9s ease-in-out infinite"
                    : undefined,
                }}
              />
            </div>
          );
        };

        /* ONLY A BAND YOU CAN ACTUALLY GET TO.

           A blend's slider range is the INTERSECTION of its leaves'
           windows, while the compromise zone is drawn from the primary
           lead's — so the two can miss each other entirely. assam +
           matcha + chamomile reaches 15-39s, because matcha shuts at
           30, and its compromise zone sits at 240-300s.

           The rail already handled that honestly: nothing overlaps, so
           it paints no coloured stretch. The WORD didn't — it appeared
           over a plain rail, naming a recommendation that wasn't drawn
           anywhere and couldn't be reached, and tapping it moved the
           slider by nothing anyone could see. Reported as "I hit
           compromise on temp then went to time and hit it, but it
           didn't update."

           So the word follows the paint: no visible band, no claim.
           What's wrong with that blend is said properly by the
           no-overlap warning further down the page, which is prose and
           has room to explain. */
        const bandWithin = (axis, rangeMin, rangeMax) => {
          const band = resolveBand(axis);
          if (!band) return null;
          if (band.hi < rangeMin || band.lo > rangeMax) return null;
          return band;
        };

        /* THE TRACK IS THE INFORMATION.
           Read left to right it says what the cup is doing: under-
           extracted at the cool/short end, the recommendation in sage,
           then over-pull climbing through ochre into terra. That is
           truer than the band it replaces — extraction quality varies
           continuously, which is exactly what the profiles encode with
           their over-pull rows, and a band drew a cliff where there is
           a slope.

           Soft edges rather than hard stops, for the same reason: a few
           points of blend either side of each boundary says "around
           here" instead of drawing a border the chemistry hasn't got. */
        const rampFor = (axis, rangeMin, rangeMax) => {
          /* BLUE, WITH A WINDOW. Every colour on this rail now
             corresponds to something the research actually knows.

             The first version ramped blue -> green -> ochre -> terra,
             reading "under-extracted, ideal, pulling, ruined". Only the
             green was earned. The profiles sample a diagonal, so
             nothing in the data describes what happens off it — the
             warm end was answering "how bad is it out here?", which is
             precisely the question a diagonal cannot answer. It looked
             informative and was inventing.

             So: blue is the range, and a coloured window is what the
             leaves agree on.

               GREEN     every leaf's window contains it — a real sweet
                         spot, narrowed to where the profiles put it at
                         the temperature (or time) you've actually set.
               OCHRE     no full agreement, but the primary lead
                         overlaps some of the others — the compromise
                         zone, which is a weaker claim and says so in a
                         weaker colour.
               NOTHING   the leaves have no common ground. Blue all the
                         way across: the app has no recommendation and
                         doesn't pretend to. */
          const BASE  = "rgba(127,154,160,0.55)";   // sky — the range itself
          const SWEET = "rgba(109,126,85,0.92)";    // sage — full agreement
          const COMP  = "rgba(189,148,76,0.88)";    // ochre — partial
          const span = rangeMax - rangeMin;
          const band = span > 0 ? bandWithin(axis, rangeMin, rangeMax) : null;
          if (!band) return BASE;

          const pct = (v) => Math.max(0, Math.min(100,
            ((Math.max(rangeMin, Math.min(rangeMax, v)) - rangeMin) / span) * 100));
          const lo = pct(band.lo);
          const hi = pct(band.hi);
          if (hi <= lo) return BASE;
          const win = band.kind === "compromise" ? COMP : SWEET;
          // A couple of points of blend at each edge. The window has a
          // definite start and end in the data, but the cup either side
          // of it isn't suddenly wrong, and a hard stop would say it is.
          const soft = 2;
          const ramp = `linear-gradient(90deg,`
            + ` ${BASE} 0%,`
            + ` ${BASE} ${Math.max(0, lo - soft)}%,`
            + ` ${win} ${lo}%,`
            + ` ${win} ${hi}%,`
            + ` ${BASE} ${Math.min(100, hi + soft)}%,`
            + ` ${BASE} 100%)`;
          if (band.kind !== "compromise") return ramp;

          /* THE COMPROMISE WINDOW IS HATCHED, so "provisional" survives
             without relying on hue.

             Sage and ochre happen to hold up under simulated colour
             deficiency — they differ in LIGHTNESS as much as hue, so
             protanopia still separates them by dE 21 — but that was
             luck, not design, and it left the difference between "every
             leaf agrees" and "this is the best compromise available"
             resting on colour alone. Stripes say provisional in a
             channel nobody can lose.

             THE PERCENTAGE-POSITION GOTCHA: with a sized background,
             `background-position: p%` aligns the image's p% point with
             the CONTAINER's p% point, so p is measured against the free
             space (container − image), not the container. Feeding `lo`
             straight in would drift the hatch off the window by more
             the wider the window got. Hence the rescale. */
          const w = Math.max(0.001, Math.min(100, hi - lo));
          const p = w >= 100 ? 0 : (lo / (100 - w)) * 100;
          const HATCH = "repeating-linear-gradient(45deg,"
            + " rgba(90,62,26,0.30) 0 3px, rgba(90,62,26,0) 3px 7px)";
          return `${HATCH} ${p}% 0 / ${w}% 100% no-repeat, ${ramp}`;
        };

        /* The ends of the track, labelled at the ends of the track —
           and, in the empty middle nobody was using, what the coloured
           window MEANS and the tap that puts you in it. One row still. */
        const RangeBands = ({ rangeMin, rangeMax, axis, step, onSnap }) => {
          const span = rangeMax - rangeMin;
          if (span <= 0) return null;
          const band = bandWithin(axis, rangeMin, rangeMax);
          const tapHint = band?.hint || "the ends of the adjustable range";
          /* WHAT THE WORD DOES: it sets the slider to the spot it names.
             That is the whole of it.

             It used to open a panel explaining the band instead, which
             made the one control on the row a button that talked. If the
             word says RECOMMENDED, tapping it should recommend — pairing
             the action with a lecture meant every tap had to be read
             before you knew which thing you'd got.

             ONE AXIS. The word under the temperature slider moves the
             temperature and nothing else — the two controls are coupled
             (where you set one moves the other's band), so a tap that
             set both would answer a question you didn't ask and destroy
             a steep time you'd already chosen. Only one slider is on
             screen at a time anyway; the word belongs to it.

             ALWAYS the centre, including when you're already inside the
             band. An earlier version left a value alone if it already
             counted as recommended, which is defensible and reads as a
             dead button: same tap, sometimes nothing.

             NEVER INTO A WARNING, though, when the band offers anywhere
             quieter — recommendedBrewTarget walks the band and asks the
             perception model what the cup would say at each point. It
             also holds the never-past-the-earliest-closing-window line
             the opening brew point is built on. A tap that answered
             "where should I brew?" by handing back a cup already being
             told off would be worse than no answer at all. */
          const snapTarget = () => recommendedBrewTarget({
            ingredients, items: bandData, band, axis,
            otherValue: axis === "tempC" ? timeS : tempC,
            step, rangeMin, rangeMax,
          });
          const endLabel = (text) => (
            <span aria-hidden style={{
              fontFamily: ff.mono, fontSize: 9, color: theme.ash,
              whiteSpace: "nowrap", pointerEvents: "none",
            }}>{text}</span>
          );
          // cToF + unit, the same conversion the readouts above use.
          const ends = axis === "tempC"
            ? [`${unit === "F" ? cToF(rangeMin) : rangeMin}°`,
               `${unit === "F" ? cToF(rangeMax) : rangeMax}°`]
            : [`${Math.round(rangeMin / 60)}m`, `${Math.round(rangeMax / 60)}m`];
          /* WHAT THE COLOUR MEANS, in the space between the ends.
             The window is painted into the track now, which is quiet and
             legible but says nothing about ITSELF — a green stretch is
             only obviously a recommendation once you already know. The
             middle of this row was empty on every blend, so the word
             goes there: no new row, and it doubles as the control that
             sets the brew to what it names. */
          const word = !band ? null
            : band.kind === "compromise" ? "compromise" : "recommended";
          return (
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", width: "100%", padding: "1px 0 2px",
            }}>
              {endLabel(ends[0])}
              {word && (
                <button
                  type="button"
                  data-testid="range-word"
                  aria-label={tapHint}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const to = snapTarget();
                    if (to != null && onSnap) onSnap(to);
                  }}
                  style={{
                    /* FLANKED, so it reads as a control. As bare text it
                       was a caption that happened to be tappable — the
                       same problem the folded brew row had, and the same
                       fix: two short rules either side, stopping clear of
                       the text, so the gap lifts it off the row instead
                       of boxing it in. The language the quick-brew column
                       already speaks.

                       No `title`. A native tooltip is a desktop-only
                       consolation for an affordance that isn't obvious,
                       and the affordance is obvious now — the label says
                       what it is and tapping it does the thing. */
                    /* THE QUICK-BREW TREATMENT, from the recipe rows.

                       That control is the app's existing answer to
                       exactly this problem: a word that has to read as
                       pressable without becoming a chip. Two hairlines
                       flanking it, inset from the ends so the gap at
                       top and bottom does the lifting, no box, no fill,
                       bark text at 0.75 opacity that comes up to full
                       under a cursor.

                       Copied rather than reinvented — three attempts
                       here (a pill, a coloured emboss, a bark-filled
                       button) all missed by inventing a treatment when
                       the app already had one.

                       NEUTRAL. The rules are `ruleSoft` and the label
                       is bark, not the band's sage or ochre. A control
                       that changes colour by meaning reads as a status
                       light; the rail underneath is already painted in
                       those colours and is the honest place for it, and
                       the WORD still names which kind of window it is.

                       The only departure: a whisper of top-down
                       gradient, which is the "bubbling up" the flat
                       version was missing. Neutral, so it reads as
                       light on a surface rather than a colour. */
                    position: "relative",
                    display: "inline-flex", alignItems: "center",
                    justifyContent: "center",
                    /* FLAT, like the quick-brew column it copies.

                       Four treatments were tried here — a pill, a
                       coloured emboss, a bark-filled button, and edge
                       shading — and each added weight to a control that
                       sits on a row of hairlines and open space. The
                       two rules and the gap above and below them are
                       the whole affordance; anything more made it an
                       object ON the row rather than part of it.

                       The recipe list has been making this exact case
                       work with nothing but two rules for a while. */
                    background: "transparent",
                    border: "none", borderRadius: 2,
                    padding: "4px 22px",
                    cursor: onSnap ? "pointer" : "default",
                    opacity: 0.75,
                    transition: "opacity 0.18s ease",
                    fontFamily: ff.sans, fontSize: 8.5,
                    letterSpacing: "0.16em", textTransform: "uppercase",
                    color: theme.bark,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.75"; }}
                >
                  {/* Longer than the recipe row's — they run nearly the
                      full height here so they read as the sides of the
                      raised face rather than two short ticks. Still
                      inset a little top and bottom: reaching the ends
                      would close the column into a box again, which is
                      the thing the gap is there to prevent. */}
                  {["left", "right"].map(side => (
                    <span key={side} aria-hidden style={{
                      position: "absolute", [side]: 0, top: "10%", bottom: "10%",
                      width: 1, background: theme.ruleSoft,
                    }} />
                  ))}
                  {word}
                </button>
              )}
              {endLabel(ends[1])}
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
          // className carries the arrival animation (see index.css).
          // The border stays on the inner element so the hairline
          // travels with the row rather than sitting at full width
          // above an empty space while the row grows into it.
          <div ref={dockArrivalRef}>
          <div style={{ borderBottom: `1px solid ${theme.ruleSoft}` }}>
            {/* THE HEADER IS TWO TARGETS, not one.
                BREW ON THE LEFT, where the word "Brew" already sat — so
                the thing that said Brew is the thing that does it. It
                stays put whether the panel is open or folded, which is
                the point: the commit action shouldn't require unfolding
                anything, and the full-width button under the slider that
                used to carry it cost the dock 44px whenever the panel
                was open.

                Not centred. The temp and time readout scans as one unit
                and splitting it with a button breaks that read — and
                left puts the commit action at the OPPOSITE end from the
                chevron, so the two easiest mis-taps are a row apart
                rather than adjacent. Commit and fold shouldn't be
                neighbours.

                Sibling buttons rather than one nested inside the other:
                a button inside a button is invalid, and the whole reason
                for the split is that these are two different actions. */}
            {/* BREW IS THE CORNER, not a button placed near it.
                It was a pill floating inside 12px of padding, which left
                it reading as an object dropped into the row rather than
                part of it — and sitting visibly low, because the row's
                padding was 8px at the top and 0 at the bottom while the
                pill centred itself against the readout beside it.

                Now the row has no padding of its own and stretches its
                children, so Brew fills the header's full height and runs
                flush into the top-left corner of the panel. The padding
                moved onto the toggle, which is the only child that still
                wants breathing room. Square corners follow from being a
                corner: a radius here would leave a sliver of dock
                showing through the angle.

                NO WRAPPER. The tour's terra pulse is a spread box-shadow,
                and a spread shadow traces its own element's border-radius
                for free — so the only way it can mis-trace is by being
                painted on a box that ISN'T the control. It used to be:
                a wrapper div held the radius and the animation, and the
                two were maintained by hand against the button inside it.
                That drifted once already (padding on the wrapper hung the
                glow ~6px below the button) and would have drifted again
                the moment this shape went square. The pulse lives on the
                button now, where CSS keeps it honest. */}
            {/* THE SAME SHAPE AS THE WRITING DOCK, and settled by the
                same argument in reverse.

                Brew as a flex sibling took width from the toggle, so the
                reading centred itself in whatever was left. Pinned
                instead, the toggle spans the whole bar and the reading
                centres against the dock — which is what the writing dock
                does with Save and "Write", so the two rows now read as
                one component the app uses twice.

                Centring also moves the text less than the right edge
                did, which is not obvious. Beside the chevron, 5:30
                becoming 10:00 pushes the reading's left edge a full
                character; centred, the pair shifts half of one. A
                readout that changes under a dragging finger should
                travel as little as it can. */}
            <div style={{
              position: "relative",
              display: "flex", alignItems: "stretch", gap: 0,
              borderBottom: shownControlsOpen
                ? `2px solid ${theme.terra}`
                : "2px solid transparent",
              marginBottom: -1,
              transition: "border-color 0.2s ease",
            }}>
              {/* A WRAPPER FOR POSITION ONLY. The tour's terra pulse
                  stays on the button inside — it is a spread box-shadow
                  and traces its own element's radius, so moving it out
                  here would be the drift tours.spec.ts exists to catch. */}
              {brewAction && (
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0, zIndex: 1,
                  display: "flex", alignItems: "stretch",
                }}>{brewAction}</div>
              )}
              <button
                data-tour="blend-controls"
                onClick={() => setControlsOpen(v => !v)}
                aria-expanded={shownControlsOpen}
                aria-label={shownControlsOpen ? "hide the brew sliders" : "show the brew sliders"}
                style={{
                  // Carries the row's horizontal breathing room now that
                  // the row itself has none — Brew needs to reach the
                  // edge, this doesn't.
                  width: "100%", background: "transparent", border: "none",
                  cursor: "pointer", padding: "10px 12px",
                  // THE READOUT SITS BESIDE BREW, left-aligned, and
                  // `adjust` gets the far end to itself. Bunched at the
                  // right they read as one blob — a temperature, a time
                  // and an instruction competing for the same corner.
                  // Split, each end says one thing: what the cup is set
                  // to, and what this row does.
                  // Spans the whole bar so the reading centres against
                  // the dock rather than against what Brew left over.
                  display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 8,
                  fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.01em",
                  fontWeight: shownControlsOpen ? 600 : 500,
                  color: shownControlsOpen ? theme.terra : theme.inkSoft,
                  transition: "color 0.2s ease",
                }}
              >
                {!brewAction && <span>Brew</span>}
                {/* THE WORDS ARE GONE, and the readout moved to meet the
                    chevron.

                    ADJUST and MINIMIZE were added because a folded row
                    was quiet — a temperature readout that happened to be
                    a button — and they did work at the time. They also
                    said the same thing the chevron says, permanently, to
                    a reader who learned it on their first cup. A label
                    that only helps once is a label that nags forever.

                    Trusting the chevron leaves the row with one thing on
                    each side: what the cup is set to, and the arrow that
                    opens the means of changing it. The readout sits
                    beside the arrow now rather than across the row from
                    it, so the pair reads as one control instead of two
                    ends of an empty gap. */}
                <span style={{
                  fontFamily: ff.mono, fontSize: 11.5,
                  color: shownControlsOpen ? theme.terra : theme.ash,
                }}>
                  {/* M:SS, not "4 min". The row is the only readout while
                      the sliders are folded away, and rounding to the
                      minute would report 3:47 as "4 min" — undoing the
                      finer step the moment anyone used it. */}
                  {displayTemp} · {displayTime}
                </span>
                {/* Same chevron as the "more filters" toggle on Compose.
                    Rotation is inverted because this panel opens UPWARD
                    out of the dock: up means expand, down means close. */}
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
            {/* Folds and unfolds visibly. `{open && <panel/>}` removed
                the subject before it could leave, so a third of the
                screen appeared and vanished between two frames with
                nothing connecting the states — the same gap the dock's
                arrival closed, in both directions this time. */}
            <Collapse open={shownControlsOpen} duration={280}
              style={{ padding: "0 12px 4px" }}>
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
                      {/* The range moved to the ends of the track it
                          describes — see RangeBands. Three numbers in
                          one corner said which was which to nobody. */}
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
                        {/* THE TOUR POINTS HERE — the rail and the word
                            beneath it, together.

                            It used to point at an invisible box laid over
                            the coloured span, because a gradient stop
                            can't be spotlit and the tour needs something
                            with a rect. What that drew was a small
                            outlined capsule floating on the track: the
                            exact shape of the band widget this design
                            replaced, still being highlighted long after
                            the band itself was painted into the rail.
                            People read it as a control.

                            The rail plus its label is a real thing, has a
                            real box, and is what the step is actually
                            about — where the recommendation is and how to
                            go there. */}
                                                <div style={{ position: "relative" }}>
                        <input
                          type="range"
                          className="brew-slider"
                          aria-label="Water temperature"
                          min={tempCRange[0]}
                          max={tempCRange[1]}
                          /* CONTINUOUS AGAIN. A flat 5°C step left
                             cinnamon's recommended window — 95-100°C —
                             with exactly two reachable values, so the
                             band you're told to brew inside had no
                             interior. The counter-argument was that no
                             kettle hits 97°C reliably; the answer is
                             that the instruction was never a number.
                             "About 20 seconds off the boil" is a
                             qualitative take that already spans a
                             range, and every kettle cools differently,
                             so the hint carries the imprecision and the
                             slider doesn't have to. */
                          step={1}
                          value={tempC}
                          onChange={(e) => setTempC(Number(e.target.value))}
                          style={{ "--brew-ramp": rampFor("tempC", tempCRange[0], tempCRange[1]) }}
                        />
                        <RangeGhost
                          rangeMin={tempCRange[0]} rangeMax={tempCRange[1]} axis="tempC"
                        />
                        <RangeBands
                          rangeMin={tempCRange[0]} rangeMax={tempCRange[1]} axis="tempC"
                          step={1}
                          onSnap={jumpTo(setTempC)}
                        />
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Same anchor on the time axis — see above. */}
                                                <div style={{ position: "relative" }}>
                        <input
                          type="range"
                          className="brew-slider"
                          aria-label="Steep time"
                          min={timeSRange[0]}
                          max={timeSRange[1]}
                          step={timeStepFor(timeSRange)}
                          value={timeS}
                          onChange={(e) => setTimeS(Number(e.target.value))}
                          style={{ "--brew-ramp": rampFor("timeS", timeSRange[0], timeSRange[1]) }}
                        />
                        <RangeGhost
                          rangeMin={timeSRange[0]} rangeMax={timeSRange[1]} axis="timeS"
                        />
                        <RangeBands
                          rangeMin={timeSRange[0]} rangeMax={timeSRange[1]} axis="timeS"
                          step={timeStepFor(timeSRange)}
                          onSnap={jumpTo(setTimeS)}
                        />
                        </div>
                      </>
                    )}
                  </div>
                </div>
            </Collapse>
          </div>
          </div>,
          brewDock,
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
          jumpNonce={brewJump}
          ingredients={ingredients}
          tempC={tempC}
          timeS={timeS}
          tempCRange={tempCRange}
          showAxis={false}
          familyMode
        />
        <BodyMap
          jumpNonce={brewJump}
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
          />
        </div>
      )}

      {/* Warnings — masking, ceiling, paradox, tannin, aromatic.
          BACK BELOW THE SLIDERS, with the caffeine gauge. Sitting them
          directly under the palate strip was tried — the argument being
          that `bitterness` and `astringency` are the bars a tannin
          warning is about — and it reads badly: a block of prose in the
          middle of the strips interrupts the panorama they form, and
          the eye has to cross it twice on every slider drag. The
          consequence cluster is where "is this cup pushing too hard?"
          signals belong, next to the finger already dragging. Outsiders
          are shown inline above with the per-ingredient pills; filtered
          here to avoid duplication. */}
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
        /* Anything the palate strip already flags is dropped here.

           A tannin warning carries an `axis` naming the palate track it
           belongs to, and that track is showing a ⚠ at the very same
           threshold — 2.5 for bitterness, 2.0 for astringency, the same
           numbers computed twice. Printing the sentence as well meant
           the cup said one thing in two places, and on a blend pushing
           both axes the near-identical bands stacked up and buried the
           leaf-specific line worth reading. Tapping the ⚠ opens the
           sentence now.

           Aromatic off-notes (soapy, camphor, acrid...) have no palate
           track and therefore no symbol, so they stay. So do the
           per-ingredient over-pull lines: those name a leaf, which no
           ⚠ can tell you. */
        const filtered = (brew.warnings || []).filter(w =>
          w.kind !== "outsider"
          && w.kind !== "caffeine"
          && !w.axis
          && w.kind !== "paradox"     // now a pill in the row above, with a description
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
              /* An ANTAGONISM reads as an alert, not a note. Paradox is
                 sage/informational — "the cup walks both sides", a
                 curiosity. Antagonism is one ingredient cancelling
                 another, which is a fault in the blend and wants the
                 same weight as an over-pull. */
              const sev = (w.kind === "tannin" || w.kind === "aromatic"
                        || w.kind === "ceiling" || w.kind === "antagonism")
                ? "over"
                : (w.kind === "paradox") ? "info" : "edge";
              const advisory = sev === "over"
                ? { accent: "#B0542F", bg: "rgba(176, 84, 47, 0.07)", tag: w.kind === "ceiling" ? "ceiling"
                       : w.kind === "aromatic" ? "aromatic"
                       : w.kind === "antagonism" ? "working against"
                       : "over the line" }
                : sev === "edge"
                ? { accent: "#A57836", bg: "rgba(165, 120, 54, 0.07)",
                    // Same word the caffeine bar uses, so the band and the
                    // gauge aren't describing one cup two ways.
                    tag: w.kind === "masking" ? "masking"
                       : w.kind === "caffeine" ? "high" : "heads up" }
                : { accent: "#627C5C", bg: "rgba(98, 124, 92, 0.08)", tag: w.kind === "paradox" ? "paradox" : "note" };
              return (
                // Keyed by what it SAYS, not by position. Index keys
                // would let a band that just fired inherit the identity
                // of one already on screen, and inherit its "already
                // arrived" state with it — the new warning would slide
                // in silently while an unrelated one re-animated.
                <Arrival key={`${w.kind}:${w.text}`} duration={240}
                  // Keyed by KIND, not by copy. The antagonism spec asserts a
                  // warning is present and then asserts what it does NOT say —
                  // a text-matched locator would go quiet the moment the
                  // wording it matched was the wording being corrected.
                  data-testid={`cup-warning-${w.kind}`}
                  style={{
                  padding: "8px 10px 8px 12px",
                  borderLeft: `2px solid ${advisory.accent}`,
                  background: advisory.bg,
                    /* LEFT. #root sets text-align: center, so every
                       band inherited it — which put the inline tag
                       (GENTLE POUR, PARADOX) in the middle of a
                       centred sentence rather than at the head of a
                       line, and made a two-line body pivot around its
                       own centre. A label leads; it doesn't float. */
                  borderRadius: "0 6px 6px 0",
                  fontFamily: ff.serif, fontSize: 12.5,
                  color: theme.ink, lineHeight: 1.45, textAlign: "left",
                }}>
                  <span style={{
                    fontFamily: ff.sans, fontSize: 9, letterSpacing: "0.16em",
                    textTransform: "uppercase", color: advisory.accent,
                    marginRight: 8, fontWeight: 600,
                  }}>{advisory.tag}</span>
                  {renderText(w.text)}
                </Arrival>
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

      {/* SYNERGY PILLS — at most three, and each one answers for itself.

          They came out for a while because they were labels and nothing
          more: a reader who could already see calm and focus sitting
          high learned nothing from being told the pairing is called
          alert calm, and on a four-leaf cup several stacked into a row
          of jargon competing with the readouts underneath.

          What earned them back was research. An audit of all thirteen
          rules (docs/research/synergies.md) found four with real
          literature — L-theanine with caffeine, valerian with lemon
          balm, menthol's cooling and alerting sharing a compound, the
          carminatives — where before there were no sources at all. A
          pill that opens onto a trial is worth its space; one that only
          names a pattern isn't.

          THREE AT MOST, strongest first. The cap is the fix for the
          stacking: a cup can legitimately trigger five or six, and past
          about three the row stops reading as findings and starts
          reading as decoration. Ranked by how strongly the cup carries
          the two effects the rule is about, so the three shown are the
          three most true of this cup rather than the first three in the
          table. */}
      {(() => {
        const effectStrength = Object.fromEntries(brew?.effects || []);
        /* SYNERGIES AND PARADOXES IN ONE ROW. They're the same kind of
           thing to a reader — a named combination this cup carries —
           and both now have researched descriptions, so both belong in
           the row that opens onto them. The paradox used to be a prose
           band lower down saying "the cup walks both sides" with
           nothing to tap; it fires on real cups (Throat Coat, Holunder
           Care, and any cup led by fennel or cardamom, which carry both
           registers alone), so it earned the same treatment. */
        const items = [
          ...new Set(brew?.synergyTags || []),
        ].map(tag => {
          const rule = EFFECT_SYNERGIES.find(r => r.label === tag);
          return {
            key: tag,
            label: tag,
            desc: SYNERGY_DESCRIPTIONS[tag],
            carried: rule ? rule.when.reduce((n, e) => n + (effectStrength[e] || 0), 0) : 0,
          };
        }).concat((brew?.paradoxTags || []).map(([a, b]) => {
          const key = [a, b].slice().sort().join("|");
          const d = PARADOX_DESCRIPTIONS[key];
          return d && {
            key,
            label: d.label,
            desc: d,
            carried: (effectStrength[a] || 0) + (effectStrength[b] || 0),
          };
        }).filter(Boolean));
        if (!items.length) return null;
        const ranked = items.sort((a, b) => b.carried - a.carried).slice(0, 3);
        return (
          <div style={{ marginTop: 14 }}>
            {/* An eyebrow, in the same register as CAFFEINE LOAD above.
                Unlabelled, the pills read as loose chips someone left
                on the page — the row said nothing about what kind of
                thing it was, so the eye filed it with the alerts it
                sits between. */}
            <div style={{
              fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.16em",
              textTransform: "uppercase", color: theme.ash, marginBottom: 6,
              // Left, like CAFFEINE LOAD above it. The region centres
              // its prose, so an eyebrow that inherits lands centred
              // over a left-aligned row of pills and reads as a caption
              // for something else.
              textAlign: "left",
            }}>in combination</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {ranked.map(({ key, label }) => {
                const open = synergyOpen === key;
                return (
                  <button
                    key={key}
                    type="button"
                    data-testid={`synergy-${label.replace(/\s+/g, "-")}`}
                    aria-expanded={open}
                    onClick={() => setSynergyOpen(open ? null : key)}
                    style={{
                      fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.08em",
                      textTransform: "uppercase", color: theme.sageDeep,
                      padding: "3px 9px", cursor: "pointer",
                      background: open ? "rgba(98, 124, 92, 0.20)" : "rgba(98, 124, 92, 0.10)",
                      border: `1px solid ${theme.sageDeep}`, borderRadius: 999,
                      transition: "background 0.18s ease",
                    }}
                  >{label}</button>
                );
              })}
            </div>
            {(() => {
              const shown = ranked.find(r => r.key === synergyOpen)?.desc;
              return shown && (
              <Arrival duration={220} data-testid="synergy-detail" style={{
                marginTop: 8,
                padding: "8px 10px 8px 12px",
                borderLeft: `2px solid ${theme.sageDeep}`,
                background: "rgba(98, 124, 92, 0.08)",
                borderRadius: "0 6px 6px 0", textAlign: "left",
              }}>
                <div style={{
                  fontFamily: ff.serif, fontSize: 12.5, color: theme.ink,
                  lineHeight: 1.45, marginBottom: 4,
                }}>{shown.summary}</div>
                <div style={{
                  fontFamily: ff.serif, fontSize: 12, color: theme.inkSoft,
                  lineHeight: 1.5, fontStyle: "italic",
                }}>{shown.body}</div>
              </Arrival>
              );
            })()}
          </div>
        );
      })()}

      {/* Adaptogen caveat — fires when adaptogen-flagged ingredients
          (tulsi, ashwagandha, reishi, lion's mane, licorice) make up
          a meaningful share of the cup. These compounds build effect
          over weeks of daily use, not within a single cup — the
          per-cup grounding/calm readouts are honest about the
          chemistry that's extracted, but they overstate what one cup
          can shift. Surfaced only when ≥20% adaptogen by weight so
          the caveat tracks with cups that are actually adaptogen-led. */}
      {/* MOVED DOWN, out from between the strips.

         This is prose about the BLEND — that two leads want steeps
         that don't overlap — and it sat between the flavour strips and
         the mind/body ones, where it split the four windows into two
         pairs with a paragraph wedged in the gap. The strips read as
         one instrument; a conditional block appearing mid-instrument
         pushed the lower half down the page the moment a second lead
         was added, and buried the comparison it was interrupting.

         It belongs with the other alerts: things that became true and
         want reading, above the standing notes and below the strips
         they describe. */}
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

      {/* STANDING NOTES — things that are true of this cup whatever the
          sliders are doing, kept together and kept quiet.

          The adaptogen caveat used to be a tinted band with a terra-
          weight left rule, which is the shape this screen uses for
          ALERTS: something just became true, look at it. That made a
          permanent piece of context shout once per render and gave the
          region four near-identical bands in a row — caffeine advisory,
          warnings, synergy detail, and this — with nothing saying which
          were events and which were furniture.

          Now it sits with the honesty footer under a hairline, in the
          quiet italic both of them deserve. Same words, correct volume,
          and the bands above get their meaning back. */}
      {(brew?.adaptogenShare >= 0.2) && (
        <div style={{
          marginTop: 16, paddingTop: 12,
          borderTop: `1px solid ${theme.ruleSoft}`,
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
          color: theme.ash, lineHeight: 1.55, textAlign: "center",
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
        // The rule belongs to the notes GROUP, so it's drawn by
        // whichever note comes first. When the adaptogen line is
        // present it has already drawn one; a second would box this
        // line off from the note it belongs with.
        marginTop: brew?.adaptogenShare >= 0.2 ? 6 : 16,
        paddingTop: brew?.adaptogenShare >= 0.2 ? 0 : 12,
        borderTop: brew?.adaptogenShare >= 0.2 ? "none" : `1px solid ${theme.ruleSoft}`,
        fontFamily: ff.serif, fontStyle: "italic", fontSize: 11,
        color: theme.ash, lineHeight: 1.5, textAlign: "center",
      }}>
        How a cup lands is partly chemistry, partly you. Treat predictions as a starting point.
      </div>
    </div>
  );
};

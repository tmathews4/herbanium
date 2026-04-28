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
import { useUnit, cToF } from "../units/units";
import { resolveBlendAtBrew, computeBrewProfile, TRADITION_TIME_TOLERANCE_S } from "../algo/compose";
import { unionAndPadTempRange, unionAndPadTimeRange } from "../algo/brewBounds";
import { INGREDIENTS } from "../data/ingredients";
import { EXTRACTION_PROFILES } from "../data/extractionProfiles";
import {
  EFFECT_DESCRIPTIONS, FLAVOR_DESCRIPTIONS,
} from "../data/vocabularyDescriptions";
import { EffectBar } from "./EffectBar";
import { VocabInfoCard } from "./layout";

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
  isTraditional = false,    // genuine cultural tradition (chai, sencha…).
                            // Required for the tradition-over-literature
                            // notice to fire; experimentals and synths
                            // shouldn't claim that lineage.
}) => {
  const { unit } = useUnit();

  const tempCRange = useMemo(() => unionAndPadTempRange(ingredients, INGREDIENTS), [ingredients]);
  const timeSRange = useMemo(() => unionAndPadTimeRange(ingredients, INGREDIENTS), [ingredients]);

  // Master union of every flavor and effect that any constituent
  // ingredient can ever produce — pulls from EXTRACTION_PROFILES first,
  // and falls back to INGREDIENTS[id].flavors / .effects for ingredients
  // without authored profile points. Used to render the full set in the
  // predicted-taste / predicted-mood strips, dimmed when the slider
  // pushes a given entry's strength to zero.
  const possible = useMemo(() => {
    const fSet = new Set(), eSet = new Set();
    const addEffect = (tag) => {
      // bitterness lives in the predicted-balance strip, not moods.
      if (tag === "bitterness") return;
      eSet.add(tag);
    };
    (ingredients || []).forEach(({ id }) => {
      const profilePoints = EXTRACTION_PROFILES[id];
      if (profilePoints && profilePoints.length > 0) {
        profilePoints.forEach(p => {
          (p.flavors || []).forEach(f => fSet.add(f));
          (p.effects || []).forEach(([tag]) => addEffect(tag));
        });
      } else {
        const meta = INGREDIENTS[id];
        if (meta) {
          (meta.flavors || []).forEach(f => fSet.add(f));
          (meta.effects || []).forEach(([tag]) => addEffect(tag));
        }
      }
    });
    return { flavors: [...fSet], effects: [...eSet] };
  }, [ingredients]);

  // Internal state — only used when parent hasn't supplied controlled values.
  const [tempCInternal, setTempCInternal] = useState(() =>
    defaultTempC ?? Math.round((tempCRange[0] + tempCRange[1]) / 2)
  );
  const [timeSInternal, setTimeSInternal] = useState(() =>
    defaultTimeS ?? Math.round((timeSRange[0] + timeSRange[1]) / 2)
  );
  const [openFlavor, setOpenFlavor] = useState(null);
  const [openEffect, setOpenEffect] = useState(null);
  // Ingredient pill currently selected for the under-row detail
  // line. Default behavior is to show the first ingredient's window
  // unless the user clicks another pill — see ensureValidSelection
  // and the inline default below.
  const [selectedIngId, setSelectedIngId] = useState(null);
  // Predicted-taste pill row caps at 6; the rest hide behind an
  // expand toggle so a long flavor list doesn't dominate the screen.
  const [flavorsExpanded, setFlavorsExpanded] = useState(false);

  const isControlled = tempCProp !== undefined && setTempCProp !== undefined;
  const tempC = isControlled ? tempCProp : tempCInternal;
  const setTempC = isControlled ? setTempCProp : setTempCInternal;
  const timeS = (timeSProp !== undefined && setTimeSProp) ? timeSProp : timeSInternal;
  const setTimeS = (timeSProp !== undefined && setTimeSProp) ? setTimeSProp : setTimeSInternal;

  // Safety: if ingredients change and the slider values are now out of
  // range, clamp them. Only applies in uncontrolled mode — parent-controlled
  // mode is responsible for its own reset logic.
  useEffect(() => {
    if (isControlled) return;
    if (tempC < tempCRange[0] || tempC > tempCRange[1]) {
      setTempC(defaultTempC ?? Math.round((tempCRange[0] + tempCRange[1]) / 2));
    }
    if (timeS < timeSRange[0] || timeS > timeSRange[1]) {
      setTimeS(defaultTimeS ?? Math.round((timeSRange[0] + timeSRange[1]) / 2));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempCRange, timeSRange]);

  // Live blend computation at current slider values. The default tempC/timeS
  // act as the baseline — per-ingredient over-pull warnings only fire when
  // the user has pushed past them. For curated blends, outsider warnings
  // are also silenced when the user sits exactly on the baseline.
  // Experimental (user-built) blends skip baseline entirely so every
  // warning fires immediately.
  const brew = experimental
    ? resolveBlendAtBrew(ingredients, tempC, timeS)
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
      {/* Per-ingredient range indicators — pills are clickable; the
          selected pill's window (and any warning) renders inline
          below the row. Default selection is the first ingredient,
          so a window always shows on render and the user knows
          others can be tapped. */}
      {brew.perIngredient && brew.perIngredient.length > 0 && (() => {
        const pills = brew.perIngredient;
        // Resolve current selection — fall back to first ingredient
        // if user hasn't picked one or their pick is no longer
        // present (e.g., ingredients changed).
        const currentId = (selectedIngId && pills.some(p => p.id === selectedIngId))
          ? selectedIngId
          : pills[0]?.id;
        const selected = pills.find(p => p.id === currentId);
        const outsiderMap = new Map(
          (brew.outsiders || []).map(o => [
            typeof o === "object" ? o.name : o,
            typeof o === "object" ? o : { name: o, tempDir: "high", timeDir: null },
          ])
        );

        // Format helpers for the inline detail line.
        const formatTempRangeShort = ([lo, hi]) =>
          unit === "F" ? `${cToF(lo)}–${cToF(hi)}°F` : `${lo}–${hi}°C`;
        const formatSteepRangeShort = ([lo, hi]) => {
          if (hi < 60) return `${lo}–${hi}s`;
          if (lo < 60) return `${lo}s–${Math.round(hi / 60)} min`;
          const a = lo / 60, b = hi / 60;
          return `${Number.isInteger(a) ? a : a.toFixed(1)}–${Number.isInteger(b) ? b : b.toFixed(1)} min`;
        };

        // Highlight helpers used in the warning copy.
        const Axis = ({ children }) => (
          <span style={{ color: theme.terra, fontStyle: "normal", fontWeight: 500 }}>{children}</span>
        );
        const tempFragment = (dir) =>
          dir === "low"  ? <Axis>below its preferred temperature</Axis>
          : dir === "high" ? <Axis>above its preferred temperature</Axis>
          : null;
        const timeFragment = (dir) =>
          dir === "under" ? <Axis>under-steeped</Axis>
          : dir === "over"  ? <Axis>over-steeped</Axis>
          : null;
        const phraseFor = (o) => {
          const t = tempFragment(o.tempDir);
          const s = timeFragment(o.timeDir);
          if (t && s) return <> — {t} and {s}</>;
          if (t)      return <> — {t}</>;
          if (s)      return <> — {s}</>;
          return null;
        };

        return (
          <div style={{ marginBottom: 14, textAlign: "left" }}>
            <div style={{
              display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
              justifyContent: "flex-start",
            }}>
              {pills.map((p) => {
                const { id, name } = p;
                const isSelected = id === currentId;
                // Pill color follows the unified state severity:
                //   green = active zone (or no-zones-declared in-range)
                //   yellow = between zones, drifting
                //   red = out of envelope OR standalone over-pull OR overPull
                const sev = p.severity || (p.inRange ? "green" : "red");
                const palette = sev === "green" ? {
                  border: theme.sage, dot: theme.sage, text: theme.sageDeep,
                  bgIdle: "rgba(109,126,85,0.10)", bgSel: "rgba(109,126,85,0.22)",
                } : sev === "yellow" ? {
                  border: theme.ochre, dot: theme.ochre, text: theme.ochre,
                  bgIdle: "rgba(189,148,76,0.10)", bgSel: "rgba(189,148,76,0.22)",
                } : {
                  border: theme.terra, dot: theme.terra, text: theme.terra,
                  bgIdle: "rgba(176,84,47,0.08)", bgSel: "rgba(176,84,47,0.18)",
                };
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedIngId(id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "3px 9px", borderRadius: 999,
                      background: isSelected ? palette.bgSel : palette.bgIdle,
                      border: `1px solid ${palette.border}`,
                      borderWidth: isSelected ? 1.5 : 1,
                      opacity: sev === "green" ? 1 : (isSelected ? 1 : 0.75),
                      cursor: "pointer",
                      fontFamily: "inherit",
                      outline: "none",
                    }}
                  >
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: palette.dot,
                    }} />
                    <span style={{
                      fontFamily: ff.sans, fontSize: 10.5,
                      color: palette.text,
                    }}>
                      {name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Inline detail line for the selected pill — its window,
                and a warning if it's out of range. Always renders
                something so the row never feels empty. */}
            {selected && (() => {
              const meta = INGREDIENTS[selected.id];
              if (!meta) return null;
              const tempStr = formatTempRangeShort(meta.tempC);
              const steepStr = meta.timeS ? formatSteepRangeShort(meta.timeS) : null;
              const sev = selected.severity || (selected.inRange ? "green" : "red");
              const borderColor = sev === "green" ? theme.sage
                : sev === "yellow" ? theme.ochre
                : theme.terra;
              const headColor = sev === "green" ? theme.sageDeep
                : sev === "yellow" ? theme.ochre
                : theme.terra;
              const edges = meta.edges || {};
              const state = selected.state;
              const tempZone = selected.tempZone;
              const timeZone = selected.timeZone;
              const combination = selected.combination;
              const legacyZone = selected.activeZone;

              return (
                <div style={{
                  marginTop: 8, paddingLeft: 10,
                  borderLeft: `2px solid ${borderColor}`,
                  fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
                  color: theme.ash, lineHeight: 1.5,
                  textAlign: "left",
                }}>
                  <div style={{ fontFamily: ff.mono, fontStyle: "normal", fontSize: 11 }}>
                    {tempStr}{steepStr ? ` · ${steepStr}` : ""}
                  </div>

                  {/* State-driven cascade. Per-axis detail (when both
                      axis zones resolve) replaces the cross-register
                      framing — temp says one thing, time says another,
                      and a combination[] entry names the emergent
                      register if notable. */}
                  {state === "over-pull" && (
                    <>
                      <div style={{ marginTop: 1 }}>
                        <span style={{ color: theme.terra, fontStyle: "normal", fontWeight: 500 }}>
                          over-pulled
                        </span>
                      </div>
                      <div style={{ marginTop: 1, color: theme.ash }}>
                        {meta.overPull?.reason || "the cup has crossed into unpleasant"}
                      </div>
                    </>
                  )}
                  {(state === "over-temp" || state === "under-temp" ||
                    state === "over-steep" || state === "under-steep") && (
                    <>
                      <div style={{ marginTop: 1 }}>
                        <span style={{ color: theme.terra, fontStyle: "normal", fontWeight: 500 }}>
                          {state === "over-temp" ? "above its window"
                           : state === "under-temp" ? "below its window"
                           : state === "over-steep" ? "over-steeped" : "under-steeped"}
                        </span>
                      </div>
                      {(() => {
                        const edge = state === "over-temp" ? edges.overTemp
                          : state === "under-temp" ? edges.underTemp
                          : state === "over-steep" ? edges.overSteep
                          : edges.underSteep;
                        return edge ? <div style={{ marginTop: 1 }}>{edge}</div> : null;
                      })()}
                    </>
                  )}
                  {state && state.startsWith("standalone-") && (
                    <>
                      <div style={{ marginTop: 1 }}>
                        <span style={{ color: theme.terra, fontStyle: "normal", fontWeight: 500 }}>
                          {state.replace("standalone-", "")} edge climbing
                        </span>
                      </div>
                      <div style={{ marginTop: 1 }}>
                        the leaf is being pushed past where it tastes right
                      </div>
                    </>
                  )}

                  {/* Per-axis status — preferred path when an
                      ingredient declares tempZones + timeZones. */}
                  {state === "in-zones" && (
                    <>
                      {combination && (
                        <div style={{ marginTop: 1 }}>
                          <span style={{ color: theme.sageDeep, fontStyle: "normal", fontWeight: 500 }}>
                            {combination.register} register
                          </span>
                          {combination.note && (
                            <span style={{ color: theme.ash }}> — {combination.note}</span>
                          )}
                        </div>
                      )}
                      <div style={{ marginTop: 3, color: theme.ash }}>
                        <div>
                          <span style={{ color: theme.inkSoft, fontStyle: "normal" }}>temp · {tempZone.id} </span>
                          {tempZone.character}
                        </div>
                        {Array.isArray(tempZone.pulls) && tempZone.pulls.length > 0 && (
                          <div style={{ paddingLeft: 12 }}>pulls {tempZone.pulls.slice(0, 3).join(", ")}</div>
                        )}
                      </div>
                      <div style={{ marginTop: 2, color: theme.ash }}>
                        <div>
                          <span style={{ color: theme.inkSoft, fontStyle: "normal" }}>steep · {timeZone.id} </span>
                          {timeZone.character}
                        </div>
                        {Array.isArray(timeZone.pulls) && timeZone.pulls.length > 0 && (
                          <div style={{ paddingLeft: 12 }}>pulls {timeZone.pulls.slice(0, 3).join(", ")}</div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Legacy 2D zone path (ingredients still on the
                      old zones[] structure). */}
                  {legacyZone && state !== "in-zones" && !state.startsWith("over-") && !state.startsWith("under-") && !state.startsWith("standalone-") && state !== "over-pull" && (
                    <>
                      <div style={{ marginTop: 1 }}>
                        <span style={{ color: theme.sageDeep, fontStyle: "normal", fontWeight: 500 }}>
                          {legacyZone.id} register
                        </span>
                      </div>
                      {legacyZone.character && <div style={{ marginTop: 1 }}>{legacyZone.character}</div>}
                    </>
                  )}

                  {state === "between-zones" && (
                    <div style={{ marginTop: 1 }}>between registers — adjust to land in one</div>
                  )}
                  {state === "in-range" && (
                    <div style={{ marginTop: 1 }}>
                      <span style={{ color: theme.sageDeep, fontStyle: "normal", fontWeight: 500 }}>
                        Perfect
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        );
      })()}

      {/* Tradition-over-literature notice — appears on curated blends
          that brew outside what the studies prescribe. The curator
          chose this point on purpose; the note acknowledges that the
          warning system has been silenced here, and explains why.
          Suppressed when the caller has lifted rendering out (e.g.
          BlendDetail places it above the preparations dropdown). */}
      {!hideTraditionNote && brew.traditionNote && (
        <div style={{
          marginBottom: 12, padding: "8px 10px", borderRadius: 6,
          background: "rgba(165, 120, 54, 0.08)",
          border: `1px solid rgba(165, 120, 54, 0.22)`,
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
          color: theme.inkSoft, lineHeight: 1.45,
        }}>
          <em style={{
            color: theme.ochre, fontStyle: "normal",
            fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em",
            textTransform: "uppercase", marginRight: 6,
          }}>tradition over literature</em>
          This brew sits outside the ranges current research recommends.
          The science matters; the centuries of practice that found this
          cup matter too — and sometimes practice knows what science
          hasn't measured yet.
          {sciDiffers && (
            <div style={{ marginTop: 6, color: theme.ash }}>
              If you'd like the research-aligned version, try{" "}
              <em style={{ fontStyle: "normal", color: theme.inkSoft }}>
                {sciTempDisplay} · {sciTimeDisplay}
              </em>.
            </div>
          )}
        </div>
      )}

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

        const RangeBands = ({ rangeMin, rangeMax, axis }) => {
          const span = rangeMax - rangeMin;
          if (span <= 0) return null;
          const empty = <div style={{ height: 6, marginTop: 2, marginBottom: 2 }} />;
          const renderBand = (lo, hi, color, tooltip) => {
            const cLo = Math.max(lo, rangeMin);
            const cHi = Math.min(hi, rangeMax);
            if (cHi <= cLo) return empty;
            const left = ((cLo - rangeMin) / span) * 100;
            const width = ((cHi - cLo) / span) * 100;
            return (
              <div style={{
                position: "relative",
                height: 6,
                marginTop: 2, marginBottom: 2,
              }}>
                <div
                  title={tooltip}
                  style={{
                    position: "absolute",
                    left: `${left}%`,
                    width: `${width}%`,
                    top: 0, bottom: 0,
                    background: color,
                    borderRadius: 2,
                  }}
                />
              </div>
            );
          };

          const ix = intersect(axis);
          if (ix) {
            const tooltip = axis === "tempC"
              ? `Sweet spot: ${ix[0]}–${ix[1]}°C`
              : `Sweet spot: ${Math.round(ix[0] / 60)}–${Math.round(ix[1] / 60)} min`;
            return renderBand(ix[0], ix[1], "rgba(109,126,85,0.30)", tooltip);
          }

          const fallback = bestCoverageZone(axis);
          if (fallback) {
            const [a, b] = fallback.range;
            const tooltip = axis === "tempC"
              ? `Compromise zone: ${a}–${b}°C (${fallback.coverage}/${fallback.total} ingredients in range)`
              : `Compromise zone: ${Math.round(a / 60)}–${Math.round(b / 60)} min (${fallback.coverage}/${fallback.total} ingredients in range)`;
            // Soft amber — calls attention without alarming. Using
            // theme.ochre family at ~30% opacity to match the green
            // band's visual weight while reading distinctly.
            return renderBand(a, b, "rgba(189,148,76,0.32)", tooltip);
          }

          return empty;
        };

        return (
          <>
            {/* Temp + time sliders. Sit ABOVE the predicted-profile bars
                so they stay in a fixed position even as bars/pills below
                populate during a slider drag. Putting them under the
                predicted profile meant the bars could expand mid-drag and
                shove the sliders downward under the user's finger. */}
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
              <RangeBands rangeMin={tempCRange[0]} rangeMax={tempCRange[1]} axis="tempC" />
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontFamily: ff.mono, fontSize: 10, color: theme.ash, marginTop: 2,
              }}>
                <span>{tempMinDisplay}°</span>
                <span>{tempMaxDisplay}°</span>
              </div>
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
              <RangeBands rangeMin={timeSRange[0]} rangeMax={timeSRange[1]} axis="timeS" />
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontFamily: ff.mono, fontSize: 10, color: theme.ash, marginTop: 2,
              }}>
                <span>{Math.round(timeSRange[0] / 60)} min</span>
                <span>{Math.round(timeSRange[1] / 60)} min</span>
              </div>
            </div>
          </>
        );
      })()}

      {/* Predicted profile — taste (flavor pills) on top, mood (effect
          bars) below. Each section renders the FULL set of entries any
          constituent ingredient can produce; entries the slider has
          pushed to zero stay in the list but render dim, so the user
          can see what's *possible* and watch each pill or bar fill in
          as the brew conditions move into its territory. Balance keeps
          its zero-strength filter — those metrics (bitterness, tartness)
          are diagnostic, not constants of the blend's identity. */}
      {(() => {
        const flavorMap = {};
        (brew.flavors || []).forEach(([n, s]) => { flavorMap[n] = s || 0; });
        const effectMap = {};
        (brew.effects || []).forEach(([t, n]) => {
          if (t === "bitterness") return;
          effectMap[t] = n || 0;
        });

        // Defensive union: any tag the algo currently emits but our
        // static-profile scan missed (e.g. a synergy-derived effect)
        // joins the master set so it isn't dropped from view.
        const fNames = new Set([...possible.flavors, ...Object.keys(flavorMap)]);
        const eTags  = new Set([...possible.effects, ...Object.keys(effectMap)]);
        const flavorEntries = [...fNames].map(name => [name, flavorMap[name] || 0]);
        const effectEntries = [...eTags].map(tag => [tag, effectMap[tag] || 0]);

        // Sort each: active first (by strength desc), inactive after (alphabetical).
        const sortMixed = (entries) => entries.sort(([a, an], [b, bn]) => {
          const aActive = Math.round(an * 10) / 10 > 0;
          const bActive = Math.round(bn * 10) / 10 > 0;
          if (aActive !== bActive) return aActive ? -1 : 1;
          if (aActive) return bn - an;
          return a.localeCompare(b);
        });
        sortMixed(flavorEntries);
        sortMixed(effectEntries);

        const visibleFlavors = flavorEntries;
        const visibleEffects = effectEntries;
        const visibleBalance = (brew.balance || []).filter(([, n]) =>
          Math.round((n || 0) * 10) / 10 > 0
        );
        if (visibleEffects.length === 0 && visibleBalance.length === 0 && visibleFlavors.length === 0) return null;

        const sectionLabel = (text) => (
          <div style={{
            fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.14em",
            textTransform: "uppercase", color: theme.ash, marginBottom: 6,
          }}>{text}</div>
        );

        return (
          <div style={{ marginBottom: 14 }}>
            {visibleFlavors.length > 0 && (() => {
              // Always show the top 6 (sorted active-first by strength,
              // then alphabetical inactives). The remainder lives behind
              // an expand toggle. Sort runs every render so the top 6
              // stays live-correct as the brew sliders move.
              const FLAVOR_HEAD = 6;
              const headFlavors = visibleFlavors.slice(0, FLAVOR_HEAD);
              const tailFlavors = visibleFlavors.slice(FLAVOR_HEAD);
              const shownFlavors = flavorsExpanded ? visibleFlavors : headFlavors;
              return (
                <div style={{ marginBottom: visibleEffects.length > 0 ? 14 : 0 }}>
                  {sectionLabel("predicted taste")}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {shownFlavors.map(([name, strength]) => {
                      const known = !!FLAVOR_DESCRIPTIONS[name];
                      const opened = openFlavor === name;
                      const isActive = Math.round(strength * 10) / 10 > 0;
                      const intensity = Math.max(0.35, Math.min(1, strength / 5));
                      return (
                        <button
                          key={name}
                          onClick={() => known && setOpenFlavor(prev => prev === name ? null : name)}
                          disabled={!known}
                          style={{
                            fontFamily: ff.sans, fontSize: 10.5,
                            color: opened ? theme.cream
                                  : isActive ? theme.terra
                                  : theme.ash,
                            letterSpacing: "0.04em",
                            padding: "3px 9px",
                            border: `1px solid ${opened || isActive ? theme.terra : theme.rule}`,
                            borderRadius: 999,
                            background: opened ? theme.terra : "transparent",
                            opacity: opened ? 1 : isActive ? intensity : 0.45,
                            fontStyle: isActive ? "normal" : "italic",
                            cursor: known ? "pointer" : "default",
                            transition: "all 0.15s ease",
                          }}
                        >{name}</button>
                      );
                    })}
                    {tailFlavors.length > 0 && (
                      <button
                        onClick={() => setFlavorsExpanded(v => !v)}
                        style={{
                          fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.08em",
                          color: theme.ash,
                          padding: "3px 9px",
                          border: `1px dashed ${theme.rule}`,
                          borderRadius: 999,
                          background: "transparent",
                          cursor: "pointer",
                          fontStyle: "italic",
                        }}
                      >
                        {flavorsExpanded ? "show fewer" : `+${tailFlavors.length} more`}
                      </button>
                    )}
                  </div>
                  {openFlavor && FLAVOR_DESCRIPTIONS[openFlavor] && (
                    <div style={{ marginTop: 10 }}>
                      <VocabInfoCard
                        term={openFlavor}
                        summary={FLAVOR_DESCRIPTIONS[openFlavor].summary}
                        tone="terra"
                        onClose={() => setOpenFlavor(null)}
                      />
                    </div>
                  )}
                </div>
              );
            })()}
            {visibleEffects.length > 0 && (() => {
              let activeIdx = 0;
              const colored = visibleEffects.map(([tag, n]) => {
                const isActive = Math.round(n * 10) / 10 > 0;
                let color;
                if (!isActive)              color = theme.ash;
                else if (activeIdx === 0) { color = theme.sage;  activeIdx++; }
                else if (activeIdx === 1) { color = theme.ochre; activeIdx++; }
                else                      { color = theme.sky;   activeIdx++; }
                return { tag, n, isActive, color };
              });
              return (
              <div style={{ marginBottom: visibleBalance.length > 0 ? 14 : 0 }}>
                {sectionLabel("predicted mood")}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {colored.map(({ tag, n, isActive, color }) => {
                    const known = !!EFFECT_DESCRIPTIONS[tag];
                    const opened = openEffect === tag;
                    return (
                      <div
                        key={tag}
                        role={known ? "button" : undefined}
                        tabIndex={known ? 0 : undefined}
                        onClick={known ? () => setOpenEffect(prev => prev === tag ? null : tag) : undefined}
                        onKeyDown={known ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setOpenEffect(prev => prev === tag ? null : tag);
                          }
                        } : undefined}
                        style={{
                          padding: "2px 4px", borderRadius: 4,
                          background: opened ? "rgba(98, 124, 92, 0.10)" : "transparent",
                          cursor: known ? "pointer" : "default",
                          outline: "none",
                        }}
                      >
                        <EffectBar label={tag} value={n} color={color} dim={!isActive} />
                      </div>
                    );
                  })}
                </div>
                {openEffect && EFFECT_DESCRIPTIONS[openEffect] && (
                  <div style={{ marginTop: 10 }}>
                    <VocabInfoCard
                      term={openEffect}
                      summary={EFFECT_DESCRIPTIONS[openEffect].summary}
                      tone="sage"
                      onClose={() => setOpenEffect(null)}
                    />
                  </div>
                )}
              </div>
              );
            })()}
            {visibleBalance.length > 0 && (
              <div>
                {sectionLabel("predicted palate")}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {visibleBalance.map(([tag, n]) => {
                    const known = !!EFFECT_DESCRIPTIONS[tag];
                    const active = openEffect === tag;
                    const color =
                      tag === "bitterness" ? theme.terra
                      : tag === "sweetness" ? theme.ochre
                      : tag === "astringency" ? theme.terra
                      : tag === "tartness" ? theme.ochre
                      : theme.sky;
                    return (
                      <div
                        key={tag}
                        role={known ? "button" : undefined}
                        tabIndex={known ? 0 : undefined}
                        onClick={known ? () => setOpenEffect(prev => prev === tag ? null : tag) : undefined}
                        onKeyDown={known ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setOpenEffect(prev => prev === tag ? null : tag);
                          }
                        } : undefined}
                        style={{
                          padding: "2px 4px", borderRadius: 4,
                          background: active ? "rgba(98, 124, 92, 0.10)" : "transparent",
                          cursor: known ? "pointer" : "default",
                          outline: "none",
                        }}
                      >
                        <EffectBar label={tag} value={n} color={color} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
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
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4, marginBottom: 14 }}>
            {filtered.map((w, i) => {
              const accent = w.kind === "ceiling" ? theme.terra
                : w.kind === "tannin" ? theme.terra
                : w.kind === "aromatic" ? theme.terra
                : w.kind === "paradox" ? theme.sageDeep
                : theme.ash;
              return (
                <div key={i} style={{
                  fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
                  color: accent, lineHeight: 1.4,
                }}>
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
      {((brew.moodSummary?.length || 0) > 0 || (brew.flavorSummary?.length || 0) > 0) && (() => {
        const summaryPill = (label, tone) => (
          <button key={label} type="button" disabled style={{
            fontFamily: ff.sans, fontSize: 10.5,
            color: tone, letterSpacing: "0.04em",
            padding: "3px 9px",
            border: `1px solid ${tone}`, borderRadius: 999,
            background: "transparent",
            cursor: "default",
          }}>{label}</button>
        );
        const labelStyle = {
          fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.14em",
          textTransform: "uppercase", color: theme.ash,
          flexShrink: 0,
        };
        return (
          <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 8 }}>
            {brew.moodSummary?.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <span style={labelStyle}>Blended Mood</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {brew.moodSummary.map(t => summaryPill(t, theme.sageDeep))}
                </div>
              </div>
            )}
            {brew.flavorSummary?.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <span style={labelStyle}>Blended Flavor</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {brew.flavorSummary.map(t => summaryPill(t, theme.terra))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

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

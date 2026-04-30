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
import { FlavorMap, MoodMap, PalateMap } from "./FlavorMap";

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
  declaredEffects = null,   // blend.effects — soft-floor for cup-level
                            // mood resolution. Without it, a curator's
                            // declared "uplifting" register can fall
                            // out of moodSummary if the perception
                            // pipeline doesn't surface it on its own.
}) => {
  const { unit } = useUnit();

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

      {/* Flavor + mood + palate across the temperature envelope.
          Sits ABOVE the temp/steep sliders now: the maps are fixed-
          height (per-track normalization keeps each band's intensity
          constant as the slider moves — only the vertical indicator
          travels), so they no longer expand mid-drag and shove the
          sliders downward. Reading order is now panorama → controls,
          which matches the way a user thinks about brewing: see the
          whole envelope, then aim for a point in it. */}
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        <FlavorMap
          ingredients={ingredients}
          tempC={tempC}
          timeS={timeS}
          tempCRange={tempCRange}
          showAxis={false}
        />
        <MoodMap
          ingredients={ingredients}
          tempC={tempC}
          timeS={timeS}
          tempCRange={tempCRange}
          showAxis={false}
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

              {/* Clipped-long-steep note. The blend's time upper bound
                  follows the most-fragile lead × 1.3 (see
                  algo/brewBounds.js), so any ingredient whose own
                  timeS[1] reaches significantly past the cap will
                  render with its long-steep range hidden. Surface
                  that explicitly so the user understands why the
                  slider stops short and where to go for the longer
                  brew (the ingredient solo, via IngredientDetail).
                  Only shows on real blends (≥2 ingredients) and
                  only if the gap is meaningful (>60s past cap). */}
              {ingredients.length >= 2 && (() => {
                const capS = timeSRange[1];
                const items = ingredients
                  .map(({ id }) => {
                    const meta = INGREDIENTS[id];
                    if (!meta?.timeS) return null;
                    const ownMaxS = meta.timeS[1];
                    if (ownMaxS <= capS + 60) return null;
                    return { name: meta.name, ownMaxMin: Math.round(ownMaxS / 60) };
                  })
                  .filter(Boolean);
                if (items.length === 0) return null;
                const capMin = Math.round(capS / 60);
                const names = items.length === 1
                  ? items[0].name
                  : items.length === 2
                    ? `${items[0].name} and ${items[1].name}`
                    : `${items.slice(0, -1).map(i => i.name).join(", ")}, and ${items[items.length - 1].name}`;
                const longestMin = Math.max(...items.map(i => i.ownMaxMin));
                return (
                  <div style={{
                    marginTop: 10,
                    padding: "8px 10px",
                    borderLeft: `2px solid ${theme.terra}`,
                    background: "rgba(176,84,47,0.05)",
                    borderRadius: "2px 6px 6px 2px",
                    fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
                    color: theme.inkSoft, lineHeight: 1.5,
                  }}>
                    <span style={{ color: theme.terra, fontStyle: "normal" }}>
                      {names}
                    </span>
                    {items.length === 1 ? " can steep" : " can each steep"} up to {longestMin} min on its own —
                    the blend caps at {capMin} min so the more fragile leads don't oversteep alongside it.
                    To brew the longer cup, open the ingredient and steep it solo.
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

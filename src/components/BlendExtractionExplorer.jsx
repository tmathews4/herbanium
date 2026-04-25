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
import { resolveBlendAtBrew } from "../algo/compose";
import { INGREDIENTS } from "../data/ingredients";
import { EffectBar } from "./EffectBar";

/**
 * Compute the UNION of all ingredients' temp ranges. Used for slider bounds.
 * Returns [min, max] in Celsius.
 */
function unionTempRange(ingredients) {
  if (!ingredients?.length) return [90, 100];
  let lo = Infinity, hi = -Infinity;
  for (const { id } of ingredients) {
    const [a, b] = INGREDIENTS[id].tempC;
    if (a < lo) lo = a;
    if (b > hi) hi = b;
  }
  return [lo, hi];
}

function unionTimeRange(ingredients) {
  if (!ingredients?.length) return [120, 600];
  let lo = Infinity, hi = -Infinity;
  for (const { id } of ingredients) {
    const [a, b] = INGREDIENTS[id].timeS;
    if (a < lo) lo = a;
    if (b > hi) hi = b;
  }
  return [lo, hi];
}

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
  defaultTempC,             // from computeBrewProfile (algorithm's recommendation)
  defaultTimeS,             // from computeBrewProfile
  tempC: tempCProp,         // optional controlled
  setTempC: setTempCProp,   // optional controlled
  timeS: timeSProp,         // optional controlled
  setTimeS: setTimeSProp,   // optional controlled
  compact = false,          // smaller layout for Compose context
}) => {
  const { unit } = useUnit();

  const tempCRange = useMemo(() => unionTempRange(ingredients), [ingredients]);
  const timeSRange = useMemo(() => unionTimeRange(ingredients), [ingredients]);

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

  // Live blend computation at current slider values
  const brew = resolveBlendAtBrew(ingredients, tempC, timeS);

  // Display formatting
  const displayTemp = unit === "F" ? `${cToF(tempC)}°F` : `${tempC}°C`;
  const displayTime = `${Math.floor(timeS / 60)}:${String(timeS % 60).padStart(2, "0")}`;
  const tempMinDisplay = unit === "F" ? cToF(tempCRange[0]) : tempCRange[0];
  const tempMaxDisplay = unit === "F" ? cToF(tempCRange[1]) : tempCRange[1];

  const compatible = brew.outsiders.length === 0;

  return (
    <div style={{
      padding: compact ? "14px 14px 16px" : "16px 16px 18px",
      borderRadius: 12,
      background: theme.cream,
      border: `1px solid ${theme.ruleSoft}`,
    }}>
      {/* Temp slider */}
      <div style={{ marginBottom: 14 }}>
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
        <div style={{
          display: "flex", justifyContent: "space-between",
          fontFamily: ff.mono, fontSize: 10, color: theme.ash, marginTop: 2,
        }}>
          <span>{tempMinDisplay}°</span>
          <span>{tempMaxDisplay}°</span>
        </div>
      </div>

      {/* Time slider */}
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
        <div style={{
          display: "flex", justifyContent: "space-between",
          fontFamily: ff.mono, fontSize: 10, color: theme.ash, marginTop: 2,
        }}>
          <span>{Math.round(timeSRange[0] / 60)} min</span>
          <span>{Math.round(timeSRange[1] / 60)} min</span>
        </div>
      </div>

      {/* Per-ingredient range indicators */}
      {brew.perIngredient && brew.perIngredient.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
          }}>
            {brew.perIngredient.map(({ id, name, inRange }) => (
              <div key={id} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "3px 9px", borderRadius: 999,
                background: inRange ? "rgba(109,126,85,0.10)" : "rgba(176,84,47,0.08)",
                border: `1px solid ${inRange ? theme.sage : theme.terra}`,
                opacity: inRange ? 1 : 0.75,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: inRange ? theme.sage : theme.terra,
                }} />
                <span style={{
                  fontFamily: ff.sans, fontSize: 10.5,
                  color: inRange ? theme.sageDeep : theme.terra,
                }}>
                  {name}
                </span>
              </div>
            ))}
          </div>
          {!compatible && (
            <div style={{
              marginTop: 6,
              fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
              color: theme.ash, lineHeight: 1.4,
            }}>
              {brew.outsiders.length === 1
                ? `${brew.outsiders[0]} is outside its preferred temp — will extract unevenly.`
                : `${brew.outsiders.join(", ")} are outside their preferred temps.`}
            </div>
          )}
        </div>
      )}

      {/* Predicted flavor strip — strength drives both sort and opacity. */}
      {brew.flavors && brew.flavors.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{
            fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.14em",
            textTransform: "uppercase", color: theme.ash, marginBottom: 6,
          }}>
            predicted flavor
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {brew.flavors.map(([name, strength]) => {
              const intensity = Math.max(0.35, Math.min(1, strength / 5));
              return (
                <span key={name} style={{
                  fontFamily: ff.sans, fontSize: 10.5,
                  color: theme.terra, letterSpacing: "0.04em",
                  padding: "3px 9px",
                  border: `1px solid ${theme.terra}`, borderRadius: 999,
                  opacity: intensity,
                }}>{name}</span>
              );
            })}
          </div>
        </div>
      )}

      {/* Effect bars — live computed blend profile */}
      {brew.effects.length > 0 && (
        <div style={{ marginBottom: brew.synergyTags?.length || brew.warnings?.length ? 14 : 0 }}>
          <div style={{
            fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.14em",
            textTransform: "uppercase", color: theme.ash, marginBottom: 6,
          }}>
            predicted effect
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {brew.effects.map(([tag, n], i) => (
              <EffectBar
                key={tag}
                label={tag}
                value={Math.round(n)}
                color={
                  tag === "bitterness" ? theme.terra
                  : i === 0           ? theme.sage
                  : i === 1           ? theme.ochre
                  : theme.sky
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Synergy tags — multi-effect bonuses the cup actually carries. */}
      {brew.synergyTags && brew.synergyTags.length > 0 && (
        <div style={{ marginBottom: brew.warnings?.length ? 12 : 0 }}>
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

      {/* Warnings — masking, ceiling, paradox. Outsiders are shown
          inline above next to the per-ingredient pills, so filter
          them here to avoid double-rendering. */}
      {(() => {
        const filtered = (brew.warnings || []).filter(w => w.kind !== "outsider");
        if (filtered.length === 0) return null;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filtered.map((w, i) => {
              const accent = w.kind === "ceiling" ? theme.terra
                : w.kind === "tannin" ? theme.terra
                : w.kind === "paradox" ? theme.sageDeep
                : theme.ash;
              return (
                <div key={i} style={{
                  fontFamily: ff.serif, fontStyle: "italic", fontSize: 11.5,
                  color: accent, lineHeight: 1.4,
                }}>
                  {w.text}
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
};

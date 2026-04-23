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

import React, { useState } from "react";
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
 * Sensible starting values given the ingredients. Uses the current
 * computeBrewProfile result from the blend, passed in as defaultTempC
 * and defaultTimeS. Falls back to range midpoints if not provided.
 */
export const BlendExtractionExplorer = ({
  ingredients,              // [{id, g}, ...]
  defaultTempC,             // from computeBrewProfile (algorithm's recommendation)
  defaultTimeS,             // from computeBrewProfile
  compact = false,          // smaller layout for Compose context
}) => {
  const { unit } = useUnit();

  const [tempCRange] = useState(() => unionTempRange(ingredients));
  const [timeSRange] = useState(() => unionTimeRange(ingredients));

  const [tempC, setTempC] = useState(() =>
    defaultTempC ?? Math.round((tempCRange[0] + tempCRange[1]) / 2)
  );
  const [timeS, setTimeS] = useState(() =>
    defaultTimeS ?? Math.round((timeSRange[0] + timeSRange[1]) / 2)
  );

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

      {/* Effect bars — live computed blend profile */}
      {brew.effects.length > 0 && (
        <div>
          <div style={{
            fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.14em",
            textTransform: "uppercase", color: theme.ash, marginBottom: 6,
          }}>
            predicted effect
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {brew.effects.slice(0, 4).map(([tag, n], i) => (
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
    </div>
  );
};

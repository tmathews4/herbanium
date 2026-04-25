/* ──────────────────────────────────────────────────────────────
   components/ExtractionExplorer.jsx — interactive temp/time explorer

   Dual-slider UI for exploring how an ingredient's flavor and effect
   profile change with brewing conditions. Lives on the Brewing tab
   of IngredientDetail; will eventually appear on BlendDetail too.

   Current implementation (V1, mock-data-driven):
   - Uses EXTRACTION_PROFILES from data/extractionProfiles.js for
     ingredients that have been authored (chamomile only at present).
   - Interpolates linearly between authored data points.
   - Two independent sliders: temperature and steep time.
   - Live updates on drag: flavors, effects, character description.

   This is v1, scoped to prove the interaction. Future:
   - Data from real research rather than hand-authored mocks
   - Non-linear interpolation reflecting real extraction curves
   - 2D surface (temp × time together) rather than two 1D axes
   - Warnings for out-of-recommended-range positions

   The UI deliberately shows "Experimental" tag until real data lands.
   ────────────────────────────────────────────────────────────── */

import React, { useState } from "react";
import { theme, ff } from "../theme";
import { useUnit, cToF } from "../units/units";
import {
  EXTRACTION_PROFILES, resolveExtractionProfile,
} from "../data/extractionProfiles";
import {
  EFFECT_DESCRIPTIONS, FLAVOR_DESCRIPTIONS,
} from "../data/vocabularyDescriptions";
import { EffectBar } from "./EffectBar";
import { VocabInfoCard } from "./layout";

// Returns true if we have mock data for this ingredient
export const hasExtractionProfile = (id) => Boolean(EXTRACTION_PROFILES[id]);

export const ExtractionExplorer = ({ ingredientId, tempCRange, timeSRange }) => {
  const { unit } = useUnit();

  // Default to the middle of each range
  const defaultTemp = Math.round((tempCRange[0] + tempCRange[1]) / 2);
  const defaultTime = Math.round((timeSRange[0] + timeSRange[1]) / 2);
  const [tempC, setTempC] = useState(defaultTemp);
  const [timeS, setTimeS] = useState(defaultTime);
  const [openFlavor, setOpenFlavor] = useState(null);
  const [openEffect, setOpenEffect] = useState(null);

  const profile = resolveExtractionProfile(ingredientId, tempC, timeS);
  if (!profile) return null;

  // Format helpers for display
  const displayTemp = unit === "F" ? `${cToF(tempC)}°F` : `${tempC}°C`;
  const displayTime = `${Math.floor(timeS / 60)}:${String(timeS % 60).padStart(2, "0")}`;

  // Convert range for display
  const tempMinDisplay = unit === "F" ? cToF(tempCRange[0]) : tempCRange[0];
  const tempMaxDisplay = unit === "F" ? cToF(tempCRange[1]) : tempCRange[1];

  return (
    <div style={{
      padding: "16px 16px 18px",
      borderRadius: 12,
      background: theme.cream,
      border: `1px solid ${theme.ruleSoft}`,
      marginBottom: 22,
    }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        marginBottom: 14,
      }}>
        <div style={{
          fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.18em",
          textTransform: "uppercase", color: theme.ash, fontWeight: 600,
        }}>
          Explore the brew
        </div>
        <div style={{
          fontFamily: ff.sans, fontSize: 9, letterSpacing: "0.14em",
          textTransform: "uppercase", color: theme.terra,
          padding: "2px 8px",
          border: `1px solid ${theme.terra}`,
          borderRadius: 999,
          opacity: 0.7,
        }}>
          experimental
        </div>
      </div>

      {/* Temperature slider */}
      <div style={{ marginBottom: 16 }}>
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
      <div style={{ marginBottom: 18 }}>
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

      {/* Character description */}
      <div style={{
        fontFamily: ff.serif, fontStyle: "italic", fontSize: 13.5,
        color: theme.inkSoft, lineHeight: 1.5,
        padding: "10px 12px",
        borderLeft: `2px solid ${theme.terra}`,
        background: "rgba(176, 84, 47, 0.04)",
        marginBottom: 14,
      }}>
        {profile.character}
      </div>

      {/* Flavor tags */}
      {profile.flavors.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{
            fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.14em",
            textTransform: "uppercase", color: theme.ash, marginBottom: 6,
          }}>
            flavor
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {profile.flavors.map(f => {
              const known = !!FLAVOR_DESCRIPTIONS[f];
              const active = openFlavor === f;
              return (
                <button
                  key={f}
                  onClick={() => known && setOpenFlavor(prev => prev === f ? null : f)}
                  disabled={!known}
                  style={{
                    fontFamily: ff.sans, fontSize: 10.5,
                    color: active ? theme.cream : theme.terra, letterSpacing: "0.04em",
                    padding: "3px 9px",
                    border: `1px solid ${theme.terra}`, borderRadius: 999,
                    background: active ? theme.terra : "transparent",
                    opacity: 0.95,
                    cursor: known ? "pointer" : "default",
                    transition: "all 0.15s ease",
                  }}
                >{f}</button>
              );
            })}
          </div>
          {openFlavor && FLAVOR_DESCRIPTIONS[openFlavor] && (
            <VocabInfoCard
              term={openFlavor}
              summary={FLAVOR_DESCRIPTIONS[openFlavor].summary}
              body={FLAVOR_DESCRIPTIONS[openFlavor].body}
              tone="terra"
              onClose={() => setOpenFlavor(null)}
            />
          )}
        </div>
      )}

      {/* Effect bars */}
      {profile.effects.length > 0 && (
        <div>
          <div style={{
            fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.14em",
            textTransform: "uppercase", color: theme.ash, marginBottom: 6,
          }}>
            effect
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {profile.effects.map(([tag, n], i) => {
              const known = !!EFFECT_DESCRIPTIONS[tag];
              const active = openEffect === tag;
              const color =
                tag === "bitterness" ? theme.terra
                : i === 0           ? theme.sage
                : i === 1           ? theme.ochre
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
          {openEffect && EFFECT_DESCRIPTIONS[openEffect] && (
            <VocabInfoCard
              term={openEffect}
              summary={EFFECT_DESCRIPTIONS[openEffect].summary}
              body={EFFECT_DESCRIPTIONS[openEffect].body}
              tone="sage"
              onClose={() => setOpenEffect(null)}
            />
          )}
        </div>
      )}
    </div>
  );
};

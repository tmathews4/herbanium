/* ──────────────────────────────────────────────────────────────
   components/FlavorMap.jsx — temperature × flavor visualization.

   A horizontal strip showing how each dominant flavor's strength
   changes across the temperature range. Reads at a glance:
   "muscatel peaks early, astringent climbs late, hibiscus tart
   stays loud everywhere." The current brew-temp slider position
   draws as a vertical indicator cutting through every track, so
   the user sees both where they ARE and what's possible at every
   other temperature.

   Each flavor gets its own row, color-coded by family. Track
   intensity (alpha) maps to flavor strength at that temp; darker
   means louder. The map runs the brew engine N times across the
   temp axis at the current steep time, so it's an honest
   prediction, not a synthetic gradient.

   Cost: N brew-engine evaluations per render. Memoized on
   (ingredients, timeS, range) so a temp-only slider drag doesn't
   recompute — only the indicator moves.
   ────────────────────────────────────────────────────────────── */

import React, { useMemo } from "react";
import { resolveBlendAtBrew } from "../algo/compose";
import { ff, theme } from "../theme";
import { cToF, useUnit } from "../units/units";

// Number of temp samples across the axis. 24 keeps the gradient
// smooth without making the engine work too hard on every change
// to ingredients / steep time.
const SAMPLES = 24;
// Number of flavors to display as their own track. Beyond ~5 the
// strip starts feeling like a checklist rather than a profile.
const MAX_TRACKS = 5;

// Family → color mapping. Keeps the strip readable as a palette
// of related notes rather than a confetti of unrelated hues.
const FAMILY_COLORS = {
  fruit:    "#B0542F",  // terra
  floral:   "#C37959",  // rose
  earthy:   "#4A573A",  // sageDeep
  spiced:   "#A57836",  // ochre
  smoky:    "#7B4A5A",  // plum
  fresh:    "#7F9AA0",  // sky
  vegetal:  "#6D7E55",  // sage
  body:     "#796E5B",  // ash
  off:      "#B0542F",  // terra (off-notes share terra to read as "warning")
};

const FAMILY_BY_FLAVOR = {
  // fruit
  muscatel: "fruit", fruit: "fruit", fruity: "fruit", peach: "fruit",
  apricot: "fruit", berry: "fruit", tart: "fruit", cranberry: "fruit",
  bright: "fruit", melon: "fruit",
  // floral
  floral: "floral", rose: "floral", orchid: "floral", honeyed: "floral",
  honey: "floral", sweet: "floral", delicate: "floral",
  // earthy / dark / woody
  earthy: "earthy", woody: "earthy", mushroom: "earthy", leather: "earthy",
  dark: "earthy", mineral: "earthy", malty: "earthy", cocoa: "earthy",
  rich: "earthy", chestnut: "earthy", nutty: "earthy", caramel: "earthy",
  toasted: "earthy", roasted: "earthy", warm: "earthy", bold: "earthy",
  robust: "earthy", brisk: "earthy", musky: "earthy", musty: "earthy",
  // spiced / warming
  spiced: "spiced", clove: "spiced", peppery: "spiced", aromatic: "spiced",
  pungent: "spiced", numbing: "spiced", hot: "spiced",
  // smoky
  smoky: "smoky", smoked: "smoky", campfire: "smoky", pine: "smoky",
  tar: "smoky", coal: "smoky",
  // fresh / cooling / mint / citrus
  citrus: "fresh", minty: "fresh", mint: "fresh", cool: "fresh",
  cooling: "fresh", fresh: "fresh", camphor: "fresh", licorice: "fresh",
  // vegetal / grassy / marine
  grassy: "vegetal", marine: "vegetal", umami: "vegetal", vegetal: "vegetal",
  oceanic: "vegetal", seaweed: "vegetal", buttery: "vegetal", savory: "vegetal",
  hay: "vegetal", bean: "vegetal",
  // body words
  creamy: "body",
  // off / diagnostic
  bitter: "off", bitterness: "off", astringent: "off", tannic: "off",
  harsh: "off", acrid: "off", soapy: "off", muddy: "off", medicinal: "off",
};

const colorFor = (flavor) => FAMILY_COLORS[FAMILY_BY_FLAVOR[flavor] || "body"] || "#796E5B";

// Hex → "r,g,b" string for rgba() composition.
const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};

export const FlavorMap = ({ ingredients, tempC, timeS, tempCRange }) => {
  const { unit } = useUnit();
  const [tMin, tMax] = tempCRange;
  const span = tMax - tMin;

  // Sample brew at SAMPLES points across the temp range. Each sample
  // returns the same shape resolveBlendAtBrew normally produces — we
  // just keep the flavors map keyed by name → strength.
  const samples = useMemo(() => {
    if (!ingredients || ingredients.length === 0 || span <= 0) return [];
    const out = [];
    for (let i = 0; i < SAMPLES; i++) {
      const t = tMin + span * (i / (SAMPLES - 1));
      const brew = resolveBlendAtBrew(
        ingredients, t, timeS, undefined, undefined,
        false, false, null,
      );
      const flavorMap = {};
      (brew.flavors || []).forEach(([name, strength]) => {
        flavorMap[name] = strength;
      });
      out.push({ t, flavorMap });
    }
    return out;
  }, [ingredients, timeS, tMin, tMax, span]);

  // Pick the top MAX_TRACKS flavors by their peak strength anywhere
  // in the envelope. Ranking by peak (not average) means notes that
  // surface only at one end still get their own row — that IS the
  // information the map is trying to surface.
  const tracks = useMemo(() => {
    const peaks = {};
    for (const s of samples) {
      for (const [name, strength] of Object.entries(s.flavorMap)) {
        peaks[name] = Math.max(peaks[name] || 0, strength);
      }
    }
    return Object.entries(peaks)
      .filter(([, peak]) => peak >= 0.5)  // drop notes that never really show up
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_TRACKS)
      .map(([name]) => name);
  }, [samples]);

  if (tracks.length === 0 || samples.length === 0) return null;

  // Build a CSS gradient for each track. Strength 0 → fully
  // transparent, strength 5 → full color. Linear scaling reads
  // intuitively here; a curve would obscure peaks.
  const gradientFor = (flavor) => {
    const rgb = hexToRgb(colorFor(flavor));
    const stops = samples.map((s, i) => {
      const x = (i / (SAMPLES - 1)) * 100;
      const strength = s.flavorMap[flavor] || 0;
      const alpha = Math.max(0, Math.min(1, strength / 5));
      return `rgba(${rgb}, ${alpha.toFixed(3)}) ${x.toFixed(1)}%`;
    }).join(", ");
    return `linear-gradient(to right, ${stops})`;
  };

  // Where to draw the indicator line. Clamped so it stays inside
  // the strip at the extremes (a half-pixel pen at the edge would
  // render half-clipped).
  const indicatorPct = span > 0
    ? Math.max(0, Math.min(100, ((tempC - tMin) / span) * 100))
    : 0;

  const tempLabel = (c) => unit === "F" ? `${cToF(c)}°F` : `${c}°C`;

  const TRACK_H   = 14;
  const TRACK_GAP = 3;

  return (
    <div style={{
      marginTop: 14, padding: "12px 12px 10px",
      background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
      borderRadius: 10,
    }}>
      <div style={{
        fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em",
        textTransform: "uppercase", color: theme.ash, marginBottom: 8,
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
      }}>
        <span>Flavor across temperature</span>
        <span style={{
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 10.5,
          letterSpacing: 0, textTransform: "none", color: theme.ash,
        }}>
          at current steep
        </span>
      </div>

      {/* Two-column layout: fixed-width labels on the left, the
          gradient-stack with the indicator overlay on the right.
          Putting the indicator's positioning context on the right
          column means the percentage math is straightforward (% of
          the gradient strip width, not of the whole row). */}
      <div style={{ display: "flex", gap: 8 }}>
        {/* Labels */}
        <div style={{
          flex: "0 0 auto",
          display: "flex", flexDirection: "column", gap: TRACK_GAP,
        }}>
          {tracks.map(flavor => (
            <div key={flavor} style={{
              height: TRACK_H,
              fontFamily: ff.sans, fontSize: 10, color: theme.inkSoft,
              display: "flex", alignItems: "center", justifyContent: "flex-end",
              minWidth: 64,
            }}>{flavor}</div>
          ))}
        </div>

        {/* Tracks + indicator */}
        <div style={{
          flex: 1, position: "relative",
          display: "flex", flexDirection: "column", gap: TRACK_GAP,
        }}>
          {tracks.map(flavor => (
            <div key={flavor} style={{
              height: TRACK_H,
              borderRadius: 3,
              background: gradientFor(flavor),
              boxShadow: `inset 0 0 0 1px ${theme.ruleSoft}`,
            }} />
          ))}
          {/* Vertical indicator — spans the whole track stack so
              the user can read what every flavor is doing at the
              current brew point at once. */}
          <div style={{
            position: "absolute",
            top: -2, bottom: -2,
            left: `${indicatorPct}%`,
            width: 2,
            transform: "translateX(-1px)",
            background: theme.terra,
            borderRadius: 1,
            pointerEvents: "none",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.55)",
          }} />
        </div>
      </div>

      {/* Temp axis ticks beneath the strip. min, midpoint, max so
          the user can read the indicator's position quickly. */}
      <div style={{
        marginTop: 6,
        marginLeft: 64 + 8,  // align with the gradient column
        display: "flex", justifyContent: "space-between",
        fontFamily: ff.mono, fontSize: 9, color: theme.ash,
      }}>
        <span>{tempLabel(tMin)}</span>
        <span>{tempLabel(Math.round((tMin + tMax) / 2))}</span>
        <span>{tempLabel(tMax)}</span>
      </div>
    </div>
  );
};

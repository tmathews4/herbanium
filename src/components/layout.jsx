/* ──────────────────────────────────────────────────────────────
   components/layout.jsx — layout primitives used across the app

   Small composable building blocks that structure page content.
   None of these know about domain concepts (ingredients, blends);
   they're pure UI primitives.

   - SectionLabel: small uppercase eyebrow label above content blocks.
     Carries typographic hierarchy without imposing heavy visual weight.

   - FitText: single-line text that scales down via CSS transform when
     it would overflow. Keeps font crisp (no integer-step resizing) and
     never reflows the surrounding layout.

   - balanceIntoRows: utility that splits N items into balanced rows,
     top row ≥ bottom row (so 7 items becomes 4+3, not 3+4).

   - ChipRows: renders a flat item list as left-aligned, balanced rows
     of chips using balanceIntoRows.

   - Chip: single-character UI unit — button with tone variants (default,
     sage, terra) and optional caution dress (dashed amber border) for
     "this would create tension" states.

   - Rule: horizontal divider, solid or dashed, soft or standard tone.

   - Toggle: label + pill on/off switch for preferences.

   - EmptyState: shared "nothing here yet" block used across library
     sub-tabs, profile stats, anywhere content may be absent. Voice:
     quiet, inviting, never scolding.

   - StatCard / Stat: small fact blocks (with/without card chrome) for
     detail screens and profile summaries.
   ────────────────────────────────────────────────────────────── */

import React from "react";
import { theme, ff } from "../theme";

// Section eyebrow — small uppercase label above each block of content.
// The `n` prop used to render roman numerals + a short rule; it's still
// accepted for backward compatibility with existing call sites, but now
// ignored. The label alone (slightly bolder) carries the hierarchy.
export const SectionLabel = ({ n, children, color = theme.ash }) => (
  <div style={{
    fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.18em",
    textTransform: "uppercase", color, fontWeight: 600,
    textAlign: "left",
  }}>
    {children}
  </div>
);

// FitText — renders children in one line; if the line overflows its container,
// the text scales down (via transform) until it fits. Keeps the font crisp
// (integer sizes would cause visible steps) and never reflows the layout.
// Pass `style` for the text's intrinsic styling (fontFamily, fontSize, etc.)
// and `minScale` if you want a floor below which it should stop shrinking.
export const FitText = ({ children, style, minScale = 0.55 }) => {
  const outerRef = React.useRef(null);
  const innerRef = React.useRef(null);
  const [scale, setScale] = React.useState(1);

  React.useLayoutEffect(() => {
    const fit = () => {
      const outer = outerRef.current;
      const inner = innerRef.current;
      if (!outer || !inner) return;
      // Reset to 1 before measuring so we read natural width.
      inner.style.transform = "scale(1)";
      const outerW = outer.clientWidth;
      const innerW = inner.scrollWidth;
      if (outerW === 0 || innerW === 0) return;
      const next = innerW > outerW ? Math.max(minScale, outerW / innerW) : 1;
      setScale(next);
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (outerRef.current) ro.observe(outerRef.current);
    return () => ro.disconnect();
  }, [children, minScale]);

  return (
    <div
      ref={outerRef}
      style={{ width: "100%", overflow: "hidden" }}
    >
      <div
        ref={innerRef}
        style={{
          ...style,
          whiteSpace: "nowrap",
          transform: `scale(${scale})`,
          transformOrigin: "left center",
          display: "inline-block",
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Balance N items into rows so each row has roughly equal count, with the
// top row being equal to or one greater than the row below it (4+3, not 3+4).
// Caps at `maxPerRow` wide items per row — anything wider gets split across
// more rows. Used by ChipRows below.
export function balanceIntoRows(items, maxPerRow = 4) {
  const n = items.length;
  if (n === 0) return [];
  if (n <= maxPerRow) return [items];
  // Pick a row count such that each row has at most maxPerRow, and rows are
  // as balanced as possible (ceil(n / rows) on top, floor(n / rows) below).
  const rows = Math.ceil(n / maxPerRow);
  const base = Math.floor(n / rows);
  const extras = n % rows; // this many rows get one extra at the top
  const sizes = Array.from({ length: rows }, (_, i) => base + (i < extras ? 1 : 0));
  const out = [];
  let cursor = 0;
  for (const size of sizes) {
    out.push(items.slice(cursor, cursor + size));
    cursor += size;
  }
  return out;
}

// ChipRows — renders a list of items as balanced, left-aligned rows of chips.
// Each row is a flex container that shares row structure (4+3 for 7 items,
// 3+3 for 6, etc.) but aligns left to match the section label above it.
export const ChipRows = ({ items, renderItem, gap = 6, rowGap = 6, maxPerRow = 4 }) => {
  const rows = balanceIntoRows(items, maxPerRow);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: rowGap }}>
      {rows.map((row, i) => (
        <div key={i} style={{
          display: "flex", justifyContent: "flex-start", flexWrap: "nowrap", gap,
        }}>
          {row.map((item, j) => renderItem(item, i * maxPerRow + j))}
        </div>
      ))}
    </div>
  );
};

export const Chip = ({ active, onClick, children, tone = "default", caution = false }) => {
  const toneMap = {
    default:  { bg: active ? theme.ink : "transparent",     fg: active ? theme.cream : theme.inkSoft, bd: active ? theme.ink : theme.rule },
    sage:     { bg: active ? theme.sageDeep : "transparent", fg: active ? theme.cream : theme.sageDeep, bd: active ? theme.sageDeep : theme.rule },
    terra:    { bg: active ? theme.terra : "transparent",    fg: active ? theme.cream : theme.terra,   bd: active ? theme.terra : theme.rule },
  }[tone];

  // Caution overrides only when not active — selected chips keep their full tone.
  // Dashed amber border + muted text is the "this would create tension" signal.
  const isCaution = caution && !active;

  return (
    <button onClick={onClick} style={{
      fontFamily: ff.sans, fontSize: 12.5, letterSpacing: "0.02em",
      padding: "6px 12px", borderRadius: 999,
      border: isCaution ? `1px dashed ${theme.terra}` : `1px solid ${toneMap.bd}`,
      background: toneMap.bg,
      color: isCaution ? theme.terra : toneMap.fg,
      opacity: isCaution ? 0.7 : 1,
      cursor: "pointer",
      transition: "all .15s ease", whiteSpace: "nowrap",
    }}>{children}</button>
  );
};

export const Rule = ({ dashed, soft }) => (
  <div style={{
    height: 1, width: "100%",
    background: dashed ? "transparent" : (soft ? theme.ruleSoft : theme.rule),
    borderTop: dashed ? `1px dashed ${theme.rule}` : "none",
  }} />
);

// Toggle — label + pill-style on/off switch. Used on Profile preferences
// and Log screen's notify options.
export const Toggle = ({ label, value, onChange }) => (
  <label style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 0", borderTop: `1px solid ${theme.ruleSoft}`,
    fontFamily: ff.sans, fontSize: 13, color: theme.inkSoft, cursor: "pointer",
  }}>
    <span>{label}</span>
    <span onClick={() => onChange(!value)} style={{
      width: 34, height: 20, borderRadius: 999,
      background: value ? theme.sageDeep : theme.rule,
      position: "relative", transition: "background .2s",
    }}>
      <span style={{
        position: "absolute", top: 2, left: value ? 16 : 2,
        width: 16, height: 16, borderRadius: "50%", background: theme.cream,
        transition: "left .2s",
      }} />
    </span>
  </label>
);

// EmptyState — shared "nothing here yet" component used across library
// sub-tabs, profile stats, and anywhere content might be genuinely absent.
// Voice: quiet, inviting, never scolding.
export const EmptyState = ({ icon, title, body, cta }) => (
  <div style={{
    padding: "22px 20px", borderRadius: 12,
    background: theme.cream, border: `1px dashed ${theme.rule}`,
    textAlign: "center",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
  }}>
    {icon && <div style={{ marginBottom: 2 }}>{icon}</div>}
    <div style={{ fontFamily: ff.serif, fontSize: 16, color: theme.ink, lineHeight: 1.2 }}>
      {title}
    </div>
    {body && (
      <div style={{ fontFamily: ff.serif, fontStyle: "italic", fontSize: 13, color: theme.ash, lineHeight: 1.5, maxWidth: 280 }}>
        {body}
      </div>
    )}
    {cta && (
      <button onClick={cta.onClick} style={{
        marginTop: 6,
        fontFamily: ff.sans, fontSize: 11.5, letterSpacing: "0.04em",
        padding: "8px 14px", borderRadius: 999,
        background: theme.ink, color: theme.cream, border: "none", cursor: "pointer",
      }}>{cta.label}</button>
    )}
  </div>
);

// StatCard — flexible "small fact" block used on detail screens.
export const StatCard = ({ label, value }) => (
  <div style={{
    flex: 1, padding: 12, borderRadius: 10,
    background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
  }}>
    <div style={{ fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.ash }}>{label}</div>
    <div style={{ fontFamily: ff.serif, fontSize: 17, color: theme.ink, marginTop: 3 }}>{value}</div>
  </div>
);

// Stat — bare label+value, no card chrome. Used on Profile summary.
export const Stat = ({ label, value }) => (
  <div>
    <div style={{ fontFamily: ff.serif, fontSize: 22, color: theme.ink, lineHeight: 1 }}>{value}</div>
    <div style={{ fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.ash, marginTop: 3 }}>{label}</div>
  </div>
);

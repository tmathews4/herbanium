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

import React, { useLayoutEffect, useRef, useState } from "react";
import { theme, ff, shadow, radius } from "../theme";

/* ──────────────────────────────────────────────────────────────
   Button system — canonical button components.

   Three variants:
     primary   — filled tint (terra | ink), the screen's main action
     secondary — outlined tint, the alternative action
     ghost     — text-only, header back/cancel/dismiss links

   Shared molded-surface treatment on filled buttons (inset top
   highlight + tinted drop shadow) so a button reads as a physical
   surface rather than a flat color rectangle. Hover deepens; press
   inverts the highlight and flattens the drop. Translate-on-press
   adds tactile feedback.
   ────────────────────────────────────────────────────────────── */

// Slightly lighter terra used for the hover fill on primary terra
// buttons. Computed once so we don't pay a string concat per render.
const TERRA_HOVER = "#BC5D33";
const INK_HOVER   = "#2A211A";

export const Button = ({
  variant = "primary",   // primary | secondary | ghost
  tone = "terra",        // terra | ink (filled / outlined variants only)
  fullWidth = false,
  disabled = false,
  icon = null,           // optional leading icon node
  children,
  onClick,
  type = "button",
  style: styleOverride = {},
  ...rest
}) => {
  // Ghost — bare text-only link. Used for back / cancel / dismiss.
  if (variant === "ghost") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        style={{
          background: "transparent", border: "none",
          color: theme.ash,
          fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em",
          textTransform: "uppercase",
          padding: "8px 6px",
          cursor: disabled ? "default" : "pointer",
          transition: "color 0.18s ease",
          opacity: disabled ? 0.4 : 1,
          width: fullWidth ? "100%" : "auto",
          ...styleOverride,
        }}
        {...rest}
      >{children}</button>
    );
  }

  const isPrimary   = variant === "primary";
  const isSecondary = variant === "secondary";
  const accent      = tone === "ink" ? theme.ink : theme.terra;
  const accentHover = tone === "ink" ? INK_HOVER : TERRA_HOVER;
  const shadowSet   = isPrimary
    ? (tone === "ink" ? shadow.btn.ink : shadow.btn.terra)
    : (tone === "ink" ? shadow.btn.ink : shadow.btn.terraOutline);

  // Disabled buttons keep a faint version of the rest shadow so they
  // still read as physical surfaces (just dimmed). Killing the shadow
  // entirely on disabled was making the compose Save/Start brewing
  // look flat in their default no-blend-yet state.
  const restShadow  = shadowSet.rest;
  const hoverShadow = shadowSet.hover;
  const pressShadow = shadowSet.press;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.boxShadow = hoverShadow;
        if (isPrimary) e.currentTarget.style.background = accentHover;
        if (isSecondary) e.currentTarget.style.background = tone === "ink"
          ? "rgba(30,24,18,0.05)"
          : "rgba(176,84,47,0.06)";
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.boxShadow = restShadow;
        e.currentTarget.style.transform = "translateY(0)";
        if (isPrimary)   e.currentTarget.style.background = accent;
        if (isSecondary) e.currentTarget.style.background = "transparent";
      }}
      onMouseDown={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = "translateY(1px)";
        e.currentTarget.style.boxShadow = pressShadow;
      }}
      onMouseUp={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = hoverShadow;
      }}
      style={{
        fontFamily: ff.serif, fontSize: 16, fontWeight: 500,
        letterSpacing: "0.02em",
        color: isPrimary ? theme.cream : accent,
        padding: "13px 22px",
        borderRadius: radius.md,
        background: isPrimary
          ? (disabled ? theme.rule : accent)
          : "transparent",
        border: isSecondary ? `1.5px solid ${accent}` : "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        width: fullWidth ? "100%" : "auto",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9,
        boxShadow: restShadow,
        transition: "background 0.18s ease, box-shadow 0.18s ease, transform 0.12s ease, color 0.18s ease",
        textShadow: isPrimary && !disabled ? "0 1px 1px rgba(0,0,0,0.08)" : "none",
        ...styleOverride,
      }}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
};

/**
 * Renders one line of text that auto-shrinks its font-size to fit
 * its container. Better than ellipsis truncation for short labels
 * (subtitles, taglines) where the whole text matters.
 *
 *   baseSize  — starting font size in px
 *   minSize   — floor; won't shrink below this
 *   style     — applied to the wrapper div (color, font-family, margin)
 *
 * Re-fits on resize via ResizeObserver. Falls back gracefully on
 * browsers without it (runs the initial fit on mount only).
 */
export function FitOneLine({ text, baseSize = 14, minSize = 10, style }) {
  const wrapRef = useRef(null);
  const textRef = useRef(null);
  const [size, setSize] = useState(baseSize);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const t = textRef.current;
    if (!wrap || !t) return;
    const fit = () => {
      let s = baseSize;
      t.style.fontSize = `${s}px`;
      while (t.scrollWidth > wrap.clientWidth && s > minSize) {
        s -= 0.5;
        t.style.fontSize = `${s}px`;
      }
      setSize(s);
    };
    fit();
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(fit);
      ro.observe(wrap);
      return () => ro.disconnect();
    }
  }, [text, baseSize, minSize]);

  return (
    <div
      ref={wrapRef}
      style={{ width: "100%", overflow: "hidden", ...style }}
    >
      <span
        ref={textRef}
        style={{
          display: "inline-block",
          whiteSpace: "nowrap",
          fontSize: size,
        }}
      >
        {text}
      </span>
    </div>
  );
}

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

// ChipRows — renders a list of items as balanced rows of chips.
// align: "start" (default) keeps chips left-aligned beside their section label.
//        "spread" uses space-between so chips reach edge-to-edge — useful
//        when a row is the dominant element (filter bars).
export const ChipRows = ({ items, renderItem, gap = 6, rowGap = 6, maxPerRow = 4, align = "start" }) => {
  const rows = balanceIntoRows(items, maxPerRow);
  const justify = align === "spread" ? "space-between" : "flex-start";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: rowGap }}>
      {rows.map((row, i) => (
        <div key={i} style={{
          display: "flex", justifyContent: justify, flexWrap: "nowrap", gap,
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

  // Subtle elevation. Resting shadow lifts every chip a hair off the
  // page so they read as tappable surfaces rather than flat rectangles;
  // active chips get a slightly stronger shadow tinted to the chip's
  // tone so the selected one stands out without changing color rules.
  const restShadow = "0 1px 2px rgba(30,24,18,0.05)";
  const activeShadow = active
    ? (tone === "sage"
        ? "0 2px 6px -1px rgba(74,87,58,0.25)"
        : tone === "terra"
        ? "0 2px 6px -1px rgba(176,84,47,0.28)"
        : "0 2px 6px -1px rgba(30,24,18,0.18)")
    : restShadow;
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
      boxShadow: isCaution ? "none" : activeShadow,
    }}>{children}</button>
  );
};

// VocabInfoCard — soft inline card that explains a vocabulary term
// (effect or flavor). Appears below the section that triggered it on
// detail pages; dismissible via × or by tapping the same chip again.
// Tone defaults sage (effect register); pass tone="terra" for flavor.
export const VocabInfoCard = ({ term, summary, body, tone = "sage", onClose }) => {
  const accent = tone === "terra" ? theme.terra : theme.sageDeep;
  const bg = tone === "terra" ? "rgba(176, 84, 47, 0.05)" : "rgba(98, 124, 92, 0.06)";
  const bd = tone === "terra" ? "rgba(176, 84, 47, 0.20)" : "rgba(98, 124, 92, 0.22)";
  return (
    <div style={{
      marginTop: 10, padding: "12px 14px", borderRadius: 8,
      background: bg, border: `1px solid ${bd}`,
      position: "relative",
    }}>
      <button
        onClick={onClose}
        aria-label="dismiss"
        style={{
          position: "absolute", top: 4, right: 6,
          background: "transparent", border: "none", cursor: "pointer",
          color: theme.ash, fontFamily: ff.sans, fontSize: 18, lineHeight: 1, padding: 4,
        }}
      >×</button>
      <div style={{
        fontFamily: ff.sans, fontSize: 10, letterSpacing: "0.16em",
        textTransform: "uppercase", color: accent, marginBottom: 4,
      }}>{term}</div>
      <div style={{
        fontFamily: ff.serif, fontStyle: "italic", fontSize: 13.5,
        color: theme.ink, lineHeight: 1.45, marginRight: 18,
      }}>{summary}</div>
      {body && (
        <div style={{
          fontFamily: ff.serif, fontSize: 12.5, color: theme.inkSoft,
          lineHeight: 1.5, marginTop: 6,
        }}>{body}</div>
      )}
    </div>
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
// When `onClick` is supplied the stat becomes a button that links to
// the relevant surface (recent brews, catalogue, pantry, etc.).
//
// Layout is forced via inline-flex column so clickable (button) and
// static (div) variants align identically as flex items in the row —
// browser button defaults otherwise drift the value/label baseline.
export const Stat = ({ label, value, onClick }) => {
  const baseStyle = {
    display: "inline-flex", flexDirection: "column", alignItems: "center",
    background: "transparent", border: "none", padding: 0,
    color: "inherit", textAlign: "center",
    font: "inherit", lineHeight: 1,
  };
  const inner = (
    <>
      <span style={{ fontFamily: ff.serif, fontSize: 22, color: theme.ink, lineHeight: 1 }}>{value}</span>
      <span style={{ fontFamily: ff.sans, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: theme.ash, marginTop: 3 }}>{label}</span>
    </>
  );
  if (!onClick) return <div style={baseStyle}>{inner}</div>;
  return (
    <button onClick={onClick} style={{ ...baseStyle, cursor: "pointer" }}>
      {inner}
    </button>
  );
};

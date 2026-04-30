/* ──────────────────────────────────────────────────────────────
   screens/EntryDetail.jsx — single free-form journal entry view.

   Same pattern as CupDetail: tapping an entry / verse / limerick
   in the Shelf > Journal timeline now opens a dedicated detail
   screen instead of expanding inline. Keeps the journal's tap
   behavior consistent — every row, cup or entry, is a doorway to
   its own page rather than a mix of "opens an overlay" and
   "expands in place."

   Renders the entry's text (italic for verse, plain for entry),
   the mood arc captured at write time, and any margin note.
   Delete lives in the top-right corner so the row no longer has
   to carry an inline ✕ that conflicts with the open-on-tap
   target.
   ────────────────────────────────────────────────────────────── */

import React from "react";
import { Pencil } from "../components/icons";
import { SectionLabel } from "../components/layout";
import { ff, theme } from "../theme";

// Same relative-time helper used by the journal row, kept local so
// the detail screen doesn't import compose internals just for one
// stamping function. Mirrors formatAgo's contract.
const formatAgo = (date) => {
  if (!date) return "";
  const ms = Date.now() - date.getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1)   return "just now";
  if (min < 60)  return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24)    return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)     return `${d}d ago`;
  return date.toLocaleDateString();
};

export const EntryDetail = ({ entry, onClose, onDelete }) => {
  if (!entry) {
    return (
      <div style={{
        position: "absolute", inset: 0, zIndex: 30,
        background: theme.ivory, padding: "22px",
      }}>
        <button onClick={onClose} style={{
          background: "transparent", border: "none", color: theme.ash,
          fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em",
          textTransform: "uppercase", cursor: "pointer",
        }}>← back</button>
        <div style={{
          marginTop: 40, textAlign: "center",
          fontFamily: ff.serif, fontStyle: "italic", color: theme.ash,
        }}>
          this entry couldn't be found
        </div>
      </div>
    );
  }

  const isHaiku    = entry.kind === "haiku";
  const isLimerick = entry.kind === "limerick";
  const isPoem     = entry.kind === "poem";
  const isVerse    = isHaiku || isLimerick || isPoem;
  const label =
    isHaiku    ? "A verse"
    : isLimerick ? "A limerick"
    : isPoem    ? "A poem"
    : "An entry";
  const stamp = entry.ts ? new Date(entry.ts) : null;
  const ago   = formatAgo(stamp);

  const handleDelete = () => {
    if (!onDelete) return;
    if (window.confirm("Remove this journal entry?")) {
      onDelete(entry.id);
      onClose?.();
    }
  };

  const start = (entry.currentMoods || []).join(", ");
  const end   = (entry.landedMoods  || []).join(", ");

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 30,
      background: theme.ivory, overflowY: "auto",
      padding: "22px 22px 32px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onClose} style={{
          background: "transparent", border: "none", color: theme.ash,
          fontFamily: ff.sans, fontSize: 12, letterSpacing: "0.12em",
          textTransform: "uppercase", cursor: "pointer",
        }}>← back</button>
        <div style={{
          fontFamily: ff.sans, fontSize: 10.5, letterSpacing: "0.18em",
          textTransform: "uppercase", color: theme.ash,
        }}>
          {label}
        </div>
        {onDelete ? (
          <button
            onClick={handleDelete}
            title="delete entry"
            style={{
              background: "transparent", border: "none",
              color: theme.ash, fontSize: 14, lineHeight: 1,
              padding: "4px 6px", cursor: "pointer",
              opacity: 0.55,
            }}
          >✕</button>
        ) : (
          <div style={{ width: 40 }} />
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: 18 }}>
        <Pencil size={22} c={theme.ochre} />
        <div style={{
          fontFamily: ff.serif, fontStyle: "italic", fontSize: 12,
          color: theme.ash, marginTop: 6,
        }}>
          {ago}
        </div>
      </div>

      {/* The entry body. Italic + wider line-height for verse so a
          haiku reads like one; plain serif for prose entries. White-
          space pre-line preserves the user's line breaks either way. */}
      <div style={{
        marginTop: 22,
        fontFamily: ff.serif,
        fontStyle: isVerse ? "italic" : "normal",
        fontSize: isVerse ? 17 : 16,
        color: theme.ink,
        lineHeight: isVerse ? 1.75 : 1.6,
        whiteSpace: "pre-line",
      }}>
        {entry.text}
      </div>

      {/* Mood arc — same start → end pattern the row used inline. */}
      {(start || end) && (
        <div style={{ marginTop: 22 }}>
          <SectionLabel>Mood arc</SectionLabel>
          <div style={{
            marginTop: 8,
            fontFamily: ff.serif, fontStyle: "italic", fontSize: 13.5,
            color: theme.ash, lineHeight: 1.4,
          }}>
            {start && (<span>{start}</span>)}
            <span style={{ margin: "0 8px", color: theme.rule, fontStyle: "normal" }}>→</span>
            {end && (<span style={{ color: theme.sageDeep, fontStyle: "normal" }}>{end}</span>)}
          </div>
        </div>
      )}

      {/* Optional note that came alongside the entry — typically a
          one-line context the user added when writing. Rendered in
          a soft cream card so it reads as separate from the body. */}
      {entry.note && entry.note.trim() && (
        <div style={{ marginTop: 22 }}>
          <SectionLabel>Note</SectionLabel>
          <div style={{
            marginTop: 8, padding: "10px 12px",
            background: theme.cream, border: `1px solid ${theme.ruleSoft}`,
            borderRadius: 8,
            fontFamily: ff.serif, fontSize: 13.5, color: theme.inkSoft,
            lineHeight: 1.5, whiteSpace: "pre-line",
          }}>
            {entry.note}
          </div>
        </div>
      )}
    </div>
  );
};
